// Node Imports
const request = require("request");

const loadQuote = () => {
  request("http://quotes.rest/qod", (error, response) => {
    if (error) throw error;

    try {
      let data = JSON.parse(response.body);

      if (data.error) {
        data.contents = {
          quotes: [
            {
              quote: data.error.message,
              author: `HTTP STATUS ${data.error.code}`,
            },
          ],
        };
      }

      let quote = data.contents.quotes[0].quote;
      let author = data.contents.quotes[0].author;

      document.getElementById("qod").innerHTML = quote;
      document.getElementById("qod-author").innerHTML = author;
    } catch (error) {
      throw error;
    }
  });
};

exports.loadQuote = loadQuote;
