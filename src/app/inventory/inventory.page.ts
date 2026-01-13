import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector:'app-inventory',
  templateUrl:'./inventory.page.html',
  styleUrls:['./inventory.page.scss']
})
export class InventoryPage implements OnInit{

  items:any[]=[];
  characters:any[]=[];
  userId="1";

  constructor(private http:HttpClient){}

  ngOnInit(){
    this.loadInventory();
    this.loadCharacters();
  }

  loadInventory(){
    this.http.get<any>(
      `http://localhost:3000/inventory/${this.userId}`
    ).subscribe(r=>this.items=r.items);
  }

  loadCharacters(){
    this.http.get<any>(
      `http://localhost:3000/characters/user/${this.userId}`
    ).subscribe(r=>this.characters=r.characters);
  }

  getSellPrice(r:string){
    return r=='common'?50:
           r=='rare'?150:
           r=='epic'?400:
           r=='legendary'?1000:20;
  }

  assignItem(i:any,c:number){
    this.http.post(
      'http://localhost:3000/inventory/assign',
      {itemId:i.id,characterId:c}
    ).subscribe();
  }

  sellItem(i:any){
    const p=this.getSellPrice(i.rarity);

    this.http.post(
      'http://localhost:3000/inventory/sell',
      {itemId:i.id,price:p}
    ).subscribe(()=>this.items=this.items.filter(x=>x.id!=i.id));
  }

  publishMarket(i:any){
    this.http.post(
      'http://localhost:3000/market/add',
      {itemId:i.id,price:i.marketPrice}
    ).subscribe(()=>this.items=this.items.filter(x=>x.id!=i.id));
  }
}
