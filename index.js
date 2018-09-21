const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();

app.use(bodyParser.json()); // allows POST and PATCH requests to come in as JSON

app.post('/messages/', (req, res, next) => {
  /***
   *  Custom message validation checks for extra attributes
   *   and asserts that all the required fields are there
   ***/
  const requiredFields = { conversation_id: 0, sender: 0, message: 0 };

  let validationError;

  // check for extraneous attributes
  for (let key in req.body) {
    if (!(key in requiredFields)) {
      validationError = new Error(
        `The key '${key}' is not a valid message attribute.`
      );
      validationError.status = 400;
      return next(validationError);
    } else {
      requiredFields[key] = 1;
    }
  }

  // check that all fields are there
  for (let key in requiredFields) {
    if (requiredFields[key] === 0) {
      validationError = new Error(
        `The key '${key}' is a required message attribute.`
      );
      validationError.status = 400;
      return next(validationError);
    }
  }

  /**
   * If we're here, then we can proceed to write to file
   */
  const id = req.body.conversation_id;
  const sender = req.body.sender;
  const message = req.body.message;

  // read the object from file
  fs.readFile('./database.json', (err, data) => {
    if (err) {
      return next(err);
    }

    // convert it from a string to an object
    data = JSON.parse(data);

    // lookup ID and push into its array
    if (data[id]) {
      data[id].push({
        sender,
        message,
        created: new Date()
      });
    } else {
      // create a new array for that ID
      data[id] = [
        {
          sender,
          message,
          created: new Date()
        }
      ];
    }
    // save the message to file
    fs.writeFile('./database.json', JSON.stringify(data), err => {
      if (err) {
        return next(err);
      }
      // respond with original message and a 201 Created Status
      return res.status(201).json(req.body);
    });
  });
});

app.get('/conversations/:conversationId', (req, res, next) => {
  const id = req.params.conversationId;

  // read from file
  fs.readFile('./database.json', (err, data) => {
    if (err) {
      return next(err);
    }
    // convert it from a string to an object
    data = JSON.parse(data);
    if (!(id in data)) {
      // make a 404 and pass it to error handler
      const notFoundErr = new Error(
        `No conversation with ID of '${id}' found.`
      );
      notFoundErr.status = 404;
      return next(notFoundErr);
    }
    const formattedResponse = { id, messages: data[id] };
    return res.json(formattedResponse);
  });
});

// global error handler must be the last thing before app.listen
//  you can tell it's an error handler by it having 4 arguments,
//   the first being an error passed into next() by a previous request handler / middleware
app.use((err, req, res, next) => {
  return res
    .status(err.status || 500) // set the response status if specified or default to 500
    .json({ error: err.message || 'Internal Server Error.' }); // send a JSON object with an error key
});

app.listen(3000, () => {
  console.log('Express app is listening on 3000');
});
