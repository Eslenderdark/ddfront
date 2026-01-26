import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { StartMenuPage } from '../start-menu/start-menu.page';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonContent, RouterModule, CommonModule, FormsModule]
})
export class GamePage implements OnInit {
  constructor(private http: HttpClient, private router: Router) { }
  public url_host = 'http://localhost:3000/' // URL del host del servidor backend
  public response: any[] = [];// Array de las respuestas del servidor
  public fullNarrative = ''; 
  public displayedText = '';
  public isTyping = false;
  public isLoading = false;
  public typingSpeed = 40; 
  public charId = Number(localStorage.getItem('selectedCharacterId'));
  public playerStats = {
    id: this.charId, 
    description: '', 
    hp: '100',
    strength: '100',
    agility: '100',
    luck: '100',
    alive: true,
    run: true,
  }


  async ngOnInit() {
    await this.recievePrompt();
    StartMenuPage.stopMenuMusic();
  }


  async recievePrompt() {
  this.isLoading = true;

  this.http.get(this.url_host + 'gemini/' + this.charId)
    .subscribe(async (response: any) => {
      this.playerStats = response.character;
      this.isLoading = false;
      await this.typeText(response.narrative + '\n\n');
    });
}



  async sendPromptResponse(letterOption: string) {
  if (this.isTyping || this.isLoading) return;

  this.isLoading = true;

  this.http.get(this.url_host + 'geminiresponse/' + letterOption)
    .subscribe(async (response: any) => {

      console.log('Respuesta del servidor:', response);

      this.playerStats.hp = response.hp;
      this.playerStats.strength = response.strength;
      this.playerStats.agility = response.agility;
      this.playerStats.luck = response.luck;


      this.isLoading = false;
      
      await this.typeText(
        `\n\n👉 Elegiste ${letterOption}\n\n${response.response}\n\n`
      );
      
      if (response.alive === false) {
        this.playerStats.alive = false;
        alert('💀 Has muerto en la aventura. Fin del juego. 💀');
        //Navegar a otra pagina
        this.router.navigate(['/start-menu']);
        return;
      }

      if (response.run === false && response.alive === true) {
        this.playerStats.run = false;
        alert('Has completado tu mision con éxito. ¡Felicidades! Guerrero');
        this.router.navigate(['/start-menu']);
        return;
      }
      }
    );}

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
