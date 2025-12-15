import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemShopPage } from './item-shop.page';

describe('ItemShopPage', () => {
  let component: ItemShopPage;
  let fixture: ComponentFixture<ItemShopPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemShopPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
