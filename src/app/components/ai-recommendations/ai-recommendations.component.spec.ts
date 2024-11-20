import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiRecommendationsComponent } from './ai-recommendations.component';

describe('AiRecommendationsComponent', () => {
  let component: AiRecommendationsComponent;
  let fixture: ComponentFixture<AiRecommendationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AiRecommendationsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AiRecommendationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
