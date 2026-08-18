import { describe, expect, it } from 'vitest';
import { validateImageFile } from './media';
describe('media validation', () => {
  it('accepts supported images and rejects unsafe or oversized files', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(validateImageFile({ type: 'image/svg+xml', size: 1000 })).toContain('JPEG');
    expect(validateImageFile({ type: 'image/png', size: 11_000_000 })).toContain('10 MB');
  });
});
