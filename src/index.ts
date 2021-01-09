import { HttpFunction } from '@google-cloud/functions-framework/build/src/functions';

export const doPost: HttpFunction = async (req, res) => {
  // res.send(JSON.stringify({result:req.body}))
  res.send(JSON.stringify({result: "Hello wordssssss"}))
  
};

