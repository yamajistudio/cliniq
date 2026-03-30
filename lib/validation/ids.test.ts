import { describe, it, expect } from 'vitest';
import { isValidUuid, validateUuid } from './ids';

// ── isValidUuid ───────────────────────────────────────────────────────────────
// Accepts v1-5 UUIDs (less strict variant check)

describe('isValidUuid', () => {
  it('aceita UUID v4 válido', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('aceita UUID v1 válido', () => {
    expect(isValidUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
  });

  it('rejeita string vazia', () => {
    expect(isValidUuid('')).toBe(false);
  });

  it('rejeita UUID sem hífens', () => {
    expect(isValidUuid('550e8400e29b41d4a716446655440000')).toBe(false);
  });

  it('rejeita UUID com caractere inválido', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-44665544000z')).toBe(false);
  });

  it('rejeita UUID muito curto', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716')).toBe(false);
  });

  it('trim: aceita UUID com espaço ao redor', () => {
    // isValidUuid faz trim internamente
    expect(isValidUuid(' 550e8400-e29b-41d4-a716-446655440000 ')).toBe(true);
  });
});

// ── validateUuid ──────────────────────────────────────────────────────────────
// Aceita apenas UUID v4 (version nibble = 4, variant = 8|9|a|b)

describe('validateUuid', () => {
  it('aceita UUID v4 válido', () => {
    expect(validateUuid('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
  });

  it('rejeita UUID v1 (version nibble ≠ 4)', () => {
    expect(validateUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(false);
  });

  it('rejeita UUID v5 (version nibble = 5)', () => {
    expect(validateUuid('74738ff5-5367-5958-9aee-98fffdcd1876')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(validateUuid('')).toBe(false);
  });

  it('rejeita número', () => {
    expect(validateUuid(42)).toBe(false);
  });

  it('rejeita null', () => {
    expect(validateUuid(null)).toBe(false);
  });

  it('rejeita undefined', () => {
    expect(validateUuid(undefined)).toBe(false);
  });

  it('rejeita UUID sem hífens', () => {
    expect(validateUuid('f47ac10b58cc4372a5670e02b2c3d479')).toBe(false);
  });

  it('rejeita UUID com variant inválido (não 8/9/a/b)', () => {
    // Third group of last segment starts with 'c' — invalid variant
    expect(validateUuid('f47ac10b-58cc-4372-c567-0e02b2c3d479')).toBe(false);
  });

  it('aceita UUID v4 com letras maiúsculas', () => {
    expect(validateUuid('F47AC10B-58CC-4372-A567-0E02B2C3D479')).toBe(true);
  });
});
