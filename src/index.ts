import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import { format } from "date-fns";

// URL do stream multipart/x-mixed-replace
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Obrigatório informar URL e DESTINO (e MS. para esperar");
  process.exit(1);
}

const url = args[0];
const destination = args[1];
const wait = args?.[2] || 0;
let startTime = Date.now();

if (!fs.existsSync(destination) || !fs.statSync(destination).isDirectory()) {
  console.error("Caminho de DESTINO deve existir");
  process.exit(1);
}

axios({
  method: "get",
  url: url,
  responseType: "stream",
})
  .then((response) => {
    let imageBuffer: Buffer[] = [];
    let capturing = false;

    response.data.on("data", (chunk: Buffer) => {
      const start = chunk.indexOf(Buffer.from([0xff, 0xd8]));
      const end = chunk.indexOf(Buffer.from([0xff, 0xd9]));

      // Se o início da imagem for encontrado e ainda não estamos capturando
      if (start !== -1 && !capturing && startTime + Number(wait) < Date.now()) {
        capturing = true;
      }

      if (capturing) {
        imageBuffer.push(
          chunk.slice(
            start !== -1 ? start : 0,
            end !== -1 ? end + 2 : chunk.length
          )
        );
      }

      // Se o final da imagem for encontrado, salva o arquivo
      if (capturing && end !== -1) {
        // imageBuffer.push(chunk.slice(start));
        // const image = Buffer.concat(imageBuffer).slice(0, end);

        const fileName = path.join(
          destination,
          `${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.jpg`
        );

        fs.writeFileSync(fileName, Buffer.concat(imageBuffer));
        // console.log("Imagem capturada e salva como captured-image.jpg");

        // Pausa o stream para parar de receber dados
        response.data.pause();

        // Fecha o stream após capturar a imagem
        response.data.destroy();
        // console.log("Stream finalizado");

        // Finaliza o processo
        process.exit(0);
      }
    });
  })
  .catch((error) => {
    console.error("Erro ao acessar o stream:", error);
  });
