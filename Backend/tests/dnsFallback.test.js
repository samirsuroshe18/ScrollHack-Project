import { hasNoUsableDns } from '../src/utils/dnsFallback.js';

test('a machine whose only DNS server is itself has no usable DNS', () => {
    expect(hasNoUsableDns(['127.0.0.1'])).toBe(true);
    expect(hasNoUsableDns(['::1'])).toBe(true);
    expect(hasNoUsableDns(['127.0.0.1', '::1'])).toBe(true);
    expect(hasNoUsableDns([])).toBe(true);
});

test('a real DNS server anywhere in the list is left alone', () => {
    expect(hasNoUsableDns(['8.8.8.8'])).toBe(false);
    expect(hasNoUsableDns(['127.0.0.1', '192.168.1.1'])).toBe(false);
    expect(hasNoUsableDns(['2409:40c2:12ab:818d::f1'])).toBe(false);
});
