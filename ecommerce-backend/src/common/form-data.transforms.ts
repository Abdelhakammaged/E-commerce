import { BadRequestException } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';

export function parseJsonValue({ value }: { value: unknown }) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new BadRequestException('Invalid JSON value');
  }
}

export function parseJsonArrayOf<T>(cls: ClassConstructor<T>) {
  return ({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return undefined;

    let parsed: unknown = value;
    if (typeof value === 'string') {
      parsed = parseJsonValue({ value });
    }

    return plainToInstance(cls, parsed);
  };
}

export function toOptionalBoolean({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

export function emptyToUndefined({ value }: { value: unknown }) {
  if (value === '') return undefined;
  return value;
}
