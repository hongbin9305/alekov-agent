// Local, read-only Windows PC measurements. No administrator privileges or private credentials.
// This module is independent of SDP, AI, OSV, and classroom demo data.
import { cpus, totalmem, freemem, platform } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

const execFileAsync = promisify(execFile);
const now = () => new Date().toISOString();
const unavailable = (reason) => ({ status: 'unavailable', reason, checkedAt: now() });

function cpuTotals() {
  const processors = cpus();
  if (!Array.isArray(processors) || processors.length === 0) return null;
  let busy = 0;
  let total = 0;
  for (const processor of processors) {
    const t = processor?.times;
    if (!t) return null;
    for (const name of ['user', 'nice', 'sys', 'idle', 'irq']) {
      if (!Number.isFinite(t[name]) || t[name] < 0) return null;
      total += t[name];
      if (name !== 'idle') busy += t[name];
    }
  }
  return { busy, total };
}

async function readCpu(signal) {
  try {
    const first = cpuTotals();
    if (!first) return unavailable('CPU 측정 자료를 읽을 수 없습니다.');
    await delay(650, undefined, { signal });
    const second = cpuTotals();
    if (!second || second.total <= first.total) return unavailable('CPU 측정 구간을 확인할 수 없습니다.');
    const percent = 100 * (second.busy - first.busy) / (second.total - first.total);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      return unavailable('CPU 사용률을 검증할 수 없습니다.');
    }
    return { status: 'ok', percent: Math.round(percent * 10) / 10, unit: '%', checkedAt: now() };
  } catch (error) {
    if (signal?.aborted) throw error;
    return unavailable('CPU 사용률 측정에 실패했습니다.');
  }
}

function readMemory() {
  try {
    const totalBytes = totalmem();
    const freeBytes = freemem();
    if (!Number.isSafeInteger(totalBytes) || !Number.isSafeInteger(freeBytes)
      || totalBytes <= 0 || freeBytes < 0 || freeBytes > totalBytes) {
      return unavailable('물리 메모리 용량을 확인할 수 없습니다.');
    }
    const usedBytes = totalBytes - freeBytes;
    return {
      status: 'ok', totalBytes, usedBytes, freeBytes,
      percent: Math.round(usedBytes / totalBytes * 1000) / 10,
      unit: 'bytes', checkedAt: now(),
    };
  } catch {
    return unavailable('메모리 정보를 읽을 수 없습니다.');
  }
}

async function readDisks(signal) {
  // Do not interpolate user input into the command: all fixed, read-only CIM fields.
  const command = "$ErrorActionPreference = 'Stop'; $vol = @(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID,Size,FreeSpace); ConvertTo-Json -InputObject $vol -Compress";
  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', command],
      { windowsHide: true, timeout: 6500, maxBuffer: 65536, signal },
    );
    const value = JSON.parse(stdout.replace(/^\uFEFF/, '').trim());
    if (!Array.isArray(value) || value.length === 0 || value.length > 26) {
      return unavailable('고정 디스크 목록을 확인할 수 없습니다.');
    }
    const drives = [];
    for (const item of value) {
      const id = item?.DeviceID;
      const totalBytes = Number(item?.Size);
      const freeBytes = Number(item?.FreeSpace);
      if (typeof id !== 'string' || !/^[A-Z]:$/.test(id)
        || !Number.isSafeInteger(totalBytes) || !Number.isSafeInteger(freeBytes)
        || totalBytes <= 0 || freeBytes < 0 || freeBytes > totalBytes) {
        return unavailable('디스크 용량 응답을 검증할 수 없습니다.');
      }
      if (drives.some(drive => drive.id === id)) return unavailable('중복된 디스크를 확인했습니다.');
      drives.push({ id, totalBytes, freeBytes, checkedAt: now(), unit: 'bytes' });
    }
    drives.sort((a, b) => a.id.localeCompare(b.id));
    return { status: 'ok', drives, checkedAt: now(), unit: 'bytes' };
  } catch (error) {
    if (signal?.aborted) throw error;
    return unavailable('디스크 정보 확인 불가: Windows CIM 조회 또는 사용 권한을 확인하세요.');
  }
}

export async function readLocalPcMetrics({ signal } = {}) {
  // Never represent Linux, macOS, demo fixtures, or an unavailable source as Windows measurements.
  if (platform() !== 'win32') {
    return {
      source: 'windows-local', observedAt: now(), platform: platform(),
      cpu: unavailable('Windows PC에서만 실측을 지원합니다.'),
      memory: unavailable('Windows PC에서만 실측을 지원합니다.'),
      disks: unavailable('Windows PC에서만 실측을 지원합니다.'),
    };
  }
  const cpu = await readCpu(signal);
  const memory = readMemory();
  const disks = await readDisks(signal);
  return { source: 'windows-local', platform: 'win32', observedAt: now(), cpu, memory, disks };
}
