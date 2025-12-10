import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InspectStackPage } from './inspect-stack.page';

describe('InspectStackPage', () => {
  let component: InspectStackPage;
  let fixture: ComponentFixture<InspectStackPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InspectStackPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
