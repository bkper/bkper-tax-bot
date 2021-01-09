import { HttpFunction } from '@google-cloud/functions-framework/build/src/functions';

export const doPost: HttpFunction = (req, res) => {
  res.send(JSON.stringify('Hello, World'));
};