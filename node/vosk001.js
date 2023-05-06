#!/usr/bin/node
/* arecord -r 16000 7.wav
 * scp -P 29641 7.wav portal59.ru:tmp/
 * node/vosk001.js > out/vosk001.out.txt 2> out/vosk001.err.txt
 */

var vosk = require('vosk')
const fs = require('fs')
const { Readable } = require('stream')
const wav = require('wav')

MODEL_PATH = '/home/reshu/.cache/vosk/vosk-model-small-ru-0.22'
FILE_NAME = '/home/reshu/tmp/7.wav'

vosk.setLogLevel(0);
const model = new vosk.Model(MODEL_PATH);

const wfReader = new wav.Reader();
const wfReadable = new Readable().wrap(wfReader);

wfReader.on('format', async ({ audioFormat, sampleRate, channels }) => {
    // console.log({sampleRate: sampleRate});process.exit(1)
    if (audioFormat != 1 || channels != 1) {
        console.error("Audio file must be WAV format mono PCM.");
        process.exit(1);
    }
    const rec = new vosk.Recognizer({model: model, sampleRate: sampleRate});
    rec.setMaxAlternatives(10);
    rec.setWords(true);
    rec.setPartialWords(true);
    for await (const data of wfReadable) {
        const end_of_speech = rec.acceptWaveform(data);
        if (end_of_speech) {
              console.log(JSON.stringify(rec.result(), null, 4));
        } else {
              console.log(JSON.stringify(rec.partialResult(), null, 4));
        }
    }
    console.log(JSON.stringify(rec.finalResult(rec), null, 4));
    rec.free();
});

fs.createReadStream(FILE_NAME, {'highWaterMark': 4096}).pipe(wfReader).on('finish', 
    function (err) {
        model.free();
});
