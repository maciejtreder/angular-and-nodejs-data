import 'zone.js/dist/zone-node';
import 'reflect-metadata';
import {enableProdMode} from '@angular/core';
import {ngExpressEngine} from '@nguniversal/express-engine';
import {provideModuleMap} from '@nguniversal/module-map-ngfactory-loader';

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as compression from 'compression';

enableProdMode();

export const app = express();

app.use(compression());
app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true }));

const {AppServerModuleNgFactory, LAZY_MODULE_MAP} = require('./dist/server/main');

const userFiles = './user_upload/';
const fs = require('fs');

app.engine('html', ngExpressEngine({
  bootstrap: AppServerModuleNgFactory,
  providers: [
    provideModuleMap(LAZY_MODULE_MAP)
  ]
}));

app.set('view engine', 'html');
app.set('views', './dist/browser');

app.put('/files', (req, res) => {
  const file = req.body;
  const base64data = file.content.replace(/^data:.*,/, '');
  fs.writeFile(userFiles + file.name, base64data, 'base64', (err) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    } else {
      res.set('Location', userFiles + file.name);
      res.status(200);
      res.send(file);
    }
  });
});

app.delete('/files/**', (req, res) => {
  const fileName = req.url.substring(7).replace(/%20/g, ' ');
  fs.unlink(userFiles + fileName, (err) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    } else {
      res.status(204);
      res.send({});
    }
  });
});

app.use('/files', express.static(userFiles));

app.get('*.*', express.static('./dist/browser', {
  maxAge: '1y'
}));

app.get('/*', (req, res) => {
  res.render('index', {req, res}, (err, html) => {
    if (html) {
      res.send(html);
    } else {
      console.error(err);
      res.send(err);
    }
  });
});
