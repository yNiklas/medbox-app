import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InspectCompartmentPage } from './inspect-compartment.page';

describe('InspectCompartmentPage', () => {
  let component: InspectCompartmentPage;
  let fixture: ComponentFixture<InspectCompartmentPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InspectCompartmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
