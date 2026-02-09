import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  boostrapApi(): string {
    return `
      <!doctype html>
      <html>
        <head><title>Desafio Inbrazz</title></head>
        <body>Orquestrador de Pedidos !</body>
      </html>
    `;
  }
}
