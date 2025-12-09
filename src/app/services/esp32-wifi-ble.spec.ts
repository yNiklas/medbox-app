import { TestBed } from '@angular/core/testing';

import { Esp32WifiBle } from './esp32-wifi-ble';

describe('Esp32WifiBle', () => {
  let service: Esp32WifiBle;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Esp32WifiBle);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
