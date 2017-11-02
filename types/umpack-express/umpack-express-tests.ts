import { umpackExpress } from 'umpack-express';
import * as express from 'express';
import * as bodyParser from 'body-parser';

const app = express();

const smtpData = {
    host: 'localhost',
    port: 25,
    user: 'user',
    password: 'password'
}

const passwordResetData = {
    smtpData: smtpData,
    senderEmail: 'test@email.com',
    resetKeyExpiresIn: '1h',
    passwordMessageFunction: function(key: string) {
        return 'take this key: ' + key;
    },
    passwordWrongEmailInstruction: function(clientIp: string) {
        return '<html><i style="background-color=#aaa">someone requested reset</i> with ip: <b>' + clientIp + '</b></html>';
    }
}

const umpack = umpackExpress({
    mongodbConnectionString: 'mongodb://localhost:27017/umpackServerTest',
    accessTokenSecret: 'myrandomstring',
    passwordHashSecret: 'mypasswordsecret',
    accessTokenExpiresIn: '1m',
    cookieAccessTokenName: 'access_token',
    passwordResetData: passwordResetData,
    deviceControl: true
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(express.static('./'));

const resRouter = express.Router();

resRouter.get('/', umpack.isAuthorized, function(req, res, next) {
    return res.send('your resources');
});

resRouter.get('/usermetadata', function(req, res, next) {
    umpack.getUserMetaDataByRequest(req)
        .then(function(result) {
            return res.send(result);
        })
        .catch(function(err) {
            return res.status(400).send({ message: err.message });
        });
});

resRouter.get('/usersbymeta', function(req, res, next) {
    umpack.filterUsersByMetaData('organizationId', '2222')
        .then(function(users) {
            res.send(users);
        })
        .catch(function(err) {
            return res.status(400).send({ message: err.message });
        });
});

resRouter.get('/userFullName', function(req, res, next) {
    umpack.getFullName('admin')
        .then(function(fullName) {
            res.send(fullName);
        })
        .catch(function(err) {
            return res.status(400).send({ message: err.message });
        });
});

resRouter.get('/userRoles', umpack.isAuthorized, function(req, res, next) {
    umpack.getUserRolesByUserName('admin')
        .then(function(result) {
            res.send(result);
        })
        .catch(function(err) {
            return res.status(400).send({ message: err.message });
        });
});

resRouter.get('/fullUserObject', function(req, res, next) {
    umpack.getFullUserObjectFromRequest(req)
        .then(function(result) {
            res.send(result);
        })
        .catch(function(err) {
            return res.status(400).send({ message: err.message });
        });
});

app.use('/um', umpack.router);
app.use('/resources', resRouter);


app.use(function(req, res, next) {
  res.redirect('/');
});

app.listen(3001, function() {
  console.log('start listening 3001');
});
