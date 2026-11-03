// Windows-only, local and read-only. Never change firewall or network configuration.
import { platform } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const now = () => new Date().toISOString();
const unavailable = reason => ({ status:'unavailable', reason, checkedAt:now() });
const clean = (s,n=120) => typeof s==='string' && s.length>0 && s.length<=n && !/[\u0000-\u001f\u007f]/.test(s) ? s : null;
const preface = "$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false); ";
async function readScript(lines, signal, timeout=8000) {
  const {stdout}=await run('powershell.exe',['-NoProfile','-NonInteractive','-Command',preface+lines.join('\n')],
    {encoding:'utf8',windowsHide:true,timeout,maxBuffer:131072,signal});
  if(!stdout||stdout.length>131072)throw Error('READ_EMPTY');
  return JSON.parse(stdout.replace(/^\uFEFF/,'').trim());
}
const networkScript=[
  '$result=$null',
  'try {',
  ' $adapters=@(Get-NetAdapter -ErrorAction Stop | ForEach-Object { [pscustomobject]@{Name=[string]$_.Name;Status=[string]$_.Status;Speed=[string]$_.LinkSpeed;Index=[int]$_.ifIndex} })',
  " $ipStatus='ok';$ips=@()",
  ' try { $ips=@(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop | ForEach-Object { [pscustomobject]@{Index=[int]$_.InterfaceIndex;Address=[string]$_.IPAddress;Prefix=[int]$_.PrefixLength} }) }',
  " catch { $ipStatus='unavailable' }",
  " $result=[pscustomobject]@{Status='ok';Adapters=$adapters;IpStatus=$ipStatus;Ips=$ips}",
  "}catch{$result=[pscustomobject]@{Status='unavailable'}}",
  'ConvertTo-Json -InputObject $result -Compress -Depth 6',
];
const firewallScript=[
  '$result=$null',
  'try {',
  ' $profiles=@(Get-NetFirewallProfile -PolicyStore ActiveStore -ErrorAction Stop | ForEach-Object { [pscustomobject]@{Name=[string]$_.Name;Enabled=[string]$_.Enabled;Inbound=[string]$_.DefaultInboundAction;Outbound=[string]$_.DefaultOutboundAction} })',
  " $result=[pscustomobject]@{Status='ok';Profiles=$profiles}",
  "}catch{$result=[pscustomobject]@{Status='unavailable'}}",
  'ConvertTo-Json -InputObject $result -Compress -Depth 5',
];
function eventScript(log,since){
  return [
    "$since=[DateTimeOffset]::Parse('"+since+"').LocalDateTime",
    '$errors=0;$warnings=0;$result=$null',
    'try {',
    " Get-WinEvent -FilterHashtable @{LogName='"+log+"';StartTime=$since;Level=@(2,3)} -ErrorAction Stop | ForEach-Object {",
    '  if($_.Level -eq 2){$errors++}elseif($_.Level -eq 3){$warnings++}',
    ' }',
    " $result=[pscustomobject]@{Status='ok';Errors=$errors;Warnings=$warnings}",
    '}catch{',
    " if([string]$_.FullyQualifiedErrorId -like 'NoMatchingEventsFound*'){$result=[pscustomobject]@{Status='ok';Errors=0;Warnings=0}}",
    " else{$result=[pscustomobject]@{Status='unavailable'}}",
    '}',
    'ConvertTo-Json -InputObject $result -Compress',
  ];
}
async function readNetwork(signal){
  try{
    const r=await readScript(networkScript,signal,7500);
    if(r?.Status!=='ok')return unavailable('Get-NetAdapter 읽기 권한이나 지원 여부를 확인하세요.');
    if(!Array.isArray(r.Adapters)||r.Adapters.length>40||!Array.isArray(r.Ips)
      ||!['ok','unavailable'].includes(r.IpStatus))return unavailable('네트워크 응답 형식을 확인할 수 없습니다.');
    const adapters=r.Adapters.map(a=>{
      const name=clean(a?.Name,100),status=clean(a?.Status,40),speed=clean(a?.Speed,50),index=a?.Index;
      return name&&status&&speed&&Number.isSafeInteger(index)&&index>=0 ? {name,status,speed,index}:null;
    });
    if(adapters.some(x=>!x))return unavailable('네트워크 어댑터 응답을 검증할 수 없습니다.');
    const ips=r.IpStatus==='ok'?r.Ips.map(x=>{
      const ip=clean(x?.Address,45),index=x?.Index,prefix=x?.Prefix;
      return ip&&/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)&&ip.split('.').every(v=>Number(v)<=255)
        &&Number.isSafeInteger(index)&&index>=0&&Number.isInteger(prefix)&&prefix>=0&&prefix<=32
        ? {ip,index,prefix}:null;
    }):[];
    if(ips.length>128||ips.some(x=>!x))return unavailable('IPv4 주소 응답을 검증할 수 없습니다.');
    return {status:'ok',adapters,ips,ipStatus:r.IpStatus,checkedAt:now()};
  }catch(e){
    if(signal?.aborted)throw e;
    return unavailable('네트워크 조회 실패: 일반 권한이나 실행 시간 제한을 확인하세요.');
  }
}
async function readFirewall(signal){
  try{
    const r=await readScript(firewallScript,signal,7500);
    if(r?.Status!=='ok')return unavailable('Get-NetFirewallProfile 조회 권한이나 지원 여부를 확인하세요.');
    if(!Array.isArray(r.Profiles)||r.Profiles.length===0||r.Profiles.length>3)
      return unavailable('방화벽 프로필 목록을 확인할 수 없습니다.');
    const profiles=r.Profiles.map(p=>{
      const name=clean(p?.Name,20),inbound=clean(p?.Inbound,50),outbound=clean(p?.Outbound,50);
      const enabled=p?.Enabled==='True'?true:p?.Enabled==='False'?false:null;
      return ['Domain','Private','Public'].includes(name)&&inbound&&outbound?{name,enabled,inbound,outbound}:null;
    });
    if(profiles.some(x=>!x)||new Set(profiles.map(p=>p.name)).size!==profiles.length)
      return unavailable('방화벽 설정 응답을 검증할 수 없습니다.');
    return {status:'ok',profiles,source:'ActiveStore',checkedAt:now()};
  }catch(e){
    if(signal?.aborted)throw e;
    return unavailable('방화벽 설정 조회 실패: 일반 권한이나 실행 시간 제한을 확인하세요.');
  }
}
async function readEvent(log,since,signal){
  try{
    const r=await readScript(eventScript(log,since),signal,9500);
    if(r?.Status!=='ok')return {name:log,...unavailable(log+' 로그 읽기 권한이 없거나 조회할 수 없습니다.')};
    if(!Number.isSafeInteger(r.Errors)||r.Errors<0||!Number.isSafeInteger(r.Warnings)||r.Warnings<0)
      return {name:log,...unavailable('Windows 이벤트 건수를 검증할 수 없습니다.')};
    return {name:log,status:'ok',warningCount:r.Warnings,errorCount:r.Errors,checkedAt:now()};
  }catch(e){
    if(signal?.aborted)throw e;
    return {name:log,...unavailable(log+' 로그 조회 실패: 일반 권한 또는 시간 초과를 확인하세요.')};
  }
}
export async function readLocalPcSecurity({signal}={}){
  const observedAt=now(),windowStart=new Date(Date.now()-86400000).toISOString();
  if(platform()!=='win32')return {
    source:'windows-local',platform:platform(),observedAt,
    network:unavailable('Windows에서만 조회를 지원합니다.'),
    firewall:unavailable('Windows에서만 조회를 지원합니다.'),
    events:{status:'unavailable',windowHours:24,windowStart,checkedAt:now(),
      logs:['System','Application'].map(name=>({name,...unavailable('Windows에서만 조회를 지원합니다.')}))}
  };
  const [network,firewall,system,application]=await Promise.all([
    readNetwork(signal),readFirewall(signal),readEvent('System',windowStart,signal),readEvent('Application',windowStart,signal)
  ]);
  const logs=[system,application],ok=logs.filter(x=>x.status==='ok').length;
  return {source:'windows-local',platform:'win32',observedAt,network,firewall,
    events:{status:ok===2?'ok':ok===1?'partial':'unavailable',logs,windowHours:24,windowStart,checkedAt:now()}};
}
