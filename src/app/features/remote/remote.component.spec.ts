import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoteComponent } from './remote.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('RemoteComponent', () => {
  let component: RemoteComponent;
  let fixture: ComponentFixture<RemoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemoteComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { id: '123' },
            },
            params: of({ id: '123' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RemoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get the room ID from the route on initialization', () => {
    expect(component.roomId).toBe('123');
  });
});
