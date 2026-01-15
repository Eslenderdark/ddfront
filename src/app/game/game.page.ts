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

  public playerStats = {
    id: '', // lo recibimos, de momento lo dejamos vacío
    description: '', // lo mismo
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

    if (!charId) {
      console.error('No hay charId seleccionado');
      return;
    }

    this.http.get(this.url_host + 'gemini/' + charId)
      .subscribe((response: any) => {
        console.log('Respuesta:', response);
        this.response.push(response.narrative);
        this.playerStats = response.character;
      });
  }

  async sendPromptResponse(letterOption: string) { // Funcion para responder a los prompts 
    this.http.get(this.url_host + 'geminiresponse/' + letterOption).subscribe((response: any) => { // LetterOption es la respuesta del usuario
      console.log('Respuesta: ' + JSON.stringify(response))
      this.playerStats = {
        id: '', // lo recibimos, de momento lo dejamos vacío
        description: '', // lo mismo
        hp: response.hp,
        strength: response.strength,
        agility: response.agility,
        luck: response.luck,
        alive: response.alive,
        run: response.run,
      }
      this.response.push(response.response);//Añadimos la respuesta al array de respuestas para verlo en pantalla
    })
  }
}
