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
    player_id: '', // lo recibimos, de momento lo dejamos vacío
    descripcion: '', // lo mismo
    vida: '100',
    fuerza: '100',
    agilidad: '100',
    suerte: '100',
    alive: 'true',
    run: 0,
  }

  async ngOnInit() { // Cuando carga la pagina, se recibe el primer prompt
    await this.recievePrompt();
  }

  async recievePrompt() { // Funcion para recibir el prompt inicial del servidor
    this.http.get(this.url_host + 'gemini').subscribe((response: any) => { // Llamada para el primer prompt (Se usa una vez)
      console.log('Respuesta: ' + JSON.stringify(response));
      this.response.push(response); //Añadimos la respuesta al array de respuestas para verlo en pantalla
    });
  }

  async sendPromptResponse(letterOption: string) { // Funcion para responder a los prompts 
    this.http.get(this.url_host + 'geminiresponse/' + letterOption).subscribe((response: any) => { // LetterOption es la respuesta del usuario
      console.log('Respuesta: ' + JSON.stringify(response))
      this.playerStats = {
        player_id: '', // lo recibimos, de momento lo dejamos vacío
        descripcion: '', // lo mismo
        vida: response.vida,
        fuerza: response.fuerza,
        agilidad: response.agilidad,
        suerte: response.suerte,
        alive: response.alive,
        run: response.run,
      }
      this.response.push(response.response);//Añadimos la respuesta al array de respuestas para verlo en pantalla
    })
  }
}
