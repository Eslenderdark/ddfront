import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector:'app-inventory',
  templateUrl:'./inventory.page.html',
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
  ],
  styleUrls:['./inventory.page.scss']
})
export class InventoryPage implements OnInit{

  characters: WritableSignal<any[]> = signal([]);
  items: WritableSignal<any[]> = signal([]);
  public url_host = 'http://localhost:3000/';
  public user_email: string = "";

  constructor(private http:HttpClient){}

  ngOnInit(){
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.user_email = user.email;
    }
    this.loadInventory();
  }

  loadInventory(){
    if(!this.user_email) return;

    this.http.get<any>(`${this.url_host}getcharactersbyemail/${encodeURIComponent(this.user_email)}`)
      .subscribe(res => {
        console.log('BACK RESPONSE:', res);
        this.characters.set(res.characters);
        this.items.set(res.items);
      });
  }

  getSellPrice(r: string){
    return r=='común'?50:
           r=='raro'?150:
           r=='épico'?400:
           r=='legendario'?1000:20;
  }

  assignItem(i:any, c:number){
    this.http.post(`${this.url_host}inventory/assign`, {itemId:i.id, characterId:c})
      .subscribe();
  }

  sellItem(i:any){
    const p=this.getSellPrice(i.rareza);
    this.http.post(`${this.url_host}inventory/sell`, {itemId:i.id, price:p})
      .subscribe(()=> this.items.set(this.items().filter(x=>x.id !== i.id)));
  }

  publishMarket(i:any){
    this.http.post(`${this.url_host}market/add`, {itemId:i.id, price:i.marketPrice})
      .subscribe(()=> this.items.set(this.items().filter(x=>x.id !== i.id)));
  }

  

  // Funciones de ejemplo para mostrar los items (puedes expandirlas)
  getItemsByCharacter(characterId: number) {
    return this.items().filter(i => i.character_id === characterId);
  }

}

