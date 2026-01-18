import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonGrid, IonRow, IonButton } from '@ionic/angular/standalone';


@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonGrid, IonRow, IonButton]
})
export class GamePage implements OnInit {


  constructor(private http: HttpClient) { }

  public url_host = 'http://localhost:3000/' // URL del host del servidor backend
  public response: any[] = [];// Array de las respuestas del servidor
  public fullNarrative = ''; 
  public displayedText = '';
  public isTyping = false;
  public isLoading = false;
  public typingSpeed = 20; 
  public playerStats = {
    id: '', 
    description: '', 
    hp: '100',
    strength: '100',
    agility: '100',
    luck: '100',
    alive: 'true',
    run: 0,
  }


  async ngOnInit() { // Cuando carga la pagina, se recibe el primer prompt
    await this.recievePrompt();
  }


  async recievePrompt() {
  const charId = localStorage.getItem('selectedCharacterId');
  if (!charId) return;

  this.isLoading = true;

  this.http.get(this.url_host + 'gemini/' + charId)
    .subscribe(async (response: any) => {
      this.playerStats = response.character;
      await this.typeText(response.narrative + '\n\n');
      this.isLoading = false;
    });
}



  async sendPromptResponse(letterOption: string) {
  if (this.isTyping || this.isLoading) return;

  this.isLoading = true;

  this.http.get(this.url_host + 'geminiresponse/' + letterOption)
    .subscribe(async (response: any) => {

      this.playerStats.hp = response.hp;
      this.playerStats.strength = response.strength;
      this.playerStats.agility = response.agility;
      this.playerStats.luck = response.luck;

      await this.typeText(
        `\n\n👉 Elegiste ${letterOption}\n\n${response.response}\n\n`
      );

      this.isLoading = false;
    });
}

  async typeText(text: string): Promise<void> {
  this.isTyping = true;

  return new Promise(resolve => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        this.fullNarrative += text.charAt(i);
        this.displayedText = this.fullNarrative;
        i++;
      } else {
        clearInterval(interval);
        this.isTyping = false;
        resolve();
      }
    }, this.typingSpeed);
  });
}




}
