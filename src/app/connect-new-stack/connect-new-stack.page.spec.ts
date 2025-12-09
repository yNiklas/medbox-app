import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectNewStackPage } from './connect-new-stack.page';

describe('ConnectNewStackPage', () => {
  let component: ConnectNewStackPage;
  let fixture: ComponentFixture<ConnectNewStackPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectNewStackPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
