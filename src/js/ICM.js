// plik do mockowania ICM

const DELAY = 1000;

const STATUS_OK = -1;
const STATUS_ERROR_ICM = 1;
const STATUS_ERROR_REQ_200 = 10;
const STATUS_ERROR_REQ_500 = 11;

(function ICM(req, res) {
  if (req.method === 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  let status;
  status = STATUS_OK;
  // status = STATUS_ERROR_ICM;
  // status = STATUS_ERROR_REQ_200;
  // status = STATUS_ERROR_REQ_500;

  setTimeout(function() {
    switch (status) {
      case STATUS_OK:
        return req.body.url_ok
          ? res.redirect(req.body.url_ok)
          : res.status(200).send('<resp status="ok"/>');
      case STATUS_ERROR_ICM:
        return req.body.url_error
          ? res.redirect(req.body.url_error)
          : res.status(400).send('<resp status="err">Cannot parse params table</resp>');
      case STATUS_ERROR_REQ_200:
        return res.status(200).send('<resp status="err">Database transaction failed</resp>');
      case STATUS_ERROR_REQ_500:
        return res.status(500).send('Internal Server Error');
      default:
        return res.status(500).send('Internal Server Error - default');
    }
  }, DELAY);
})(req, res);
