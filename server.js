import express, { json, query } from "express";
import { createConnection } from "mysql";
import cors from "cors";
import nodemailer from 'nodemailer';  //utilizza il protocollo SMTP di Google
import bodyParser from "body-parser";

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const db = createConnection({
    user: 'real-home',
    host: 'mysql-real-home.alwaysdata.net',
    database: 'real-home_db',
    password: 'T3cn0|0g13'
})

//provo connessione 
db.connect((err) => {
    if(err) {
    console.log(err);
    console.log('dont worked to MYSQL');
    throw err;
    }
});

//registrazione account cliente
app.post('/signup', (req, res) => {
    const sql = "INSERT INTO Signup (Name, Email, Password) VALUES (?, ?, ?)";
    const values = [req.body.name, req.body.email, req.body.password];

    db.query(sql, values, (err, data) => {
        if(err) {
            return res.json("Error");
        }
        return res.json(data);
    })
})

//login per clienti ed admin
app.post('/login', (req, res) => {
    const sql = "SELECT 'Signup' AS type, Signup.Id_signup, Signup.Name, Signup.Email, Signup.Password " +
                "FROM Signup WHERE Signup.Email = ? AND Signup.Password = ? " +
                "UNION SELECT 'Admin' AS type, Admin.Id_admin, Admin.Nome AS Name, Admin.Email, Admin.Password " +
                "FROM Admin WHERE Admin.Email = ? AND Admin.Password = ? " +
                "UNION SELECT 'Agente' AS type, Agente.Id_agente, Agente.Nome, Agente.Email, Agente.Password "+
                "FROM Agente WHERE Agente.Email = ? AND Agente.Password = ? ;" ;
    const values = [req.body.email, req.body.password, req.body.email, req.body.password, req.body.email, req.body.password];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            const userId = data[0].Id_signup;
            const nameU = data[0].Name;
            const emailU = data[0].Email;
            const type = data[0].type;
            return res.json({ status: "Success", Id_signup: userId, name: nameU, email: emailU, type: type });
        } else {
            return res.json("Failed");
        }
    })
});


//lista amministratori
app.post('/admin/listaAdmin', (req, res) => {
    const sql = "SELECT * FROM Admin";

    db.query(sql, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            // Prendi solo la prima riga dei risultati
            const firstAdmin = data[0];
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                admins: data // Invia tutti gli amministratori al frontend
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
})

//nuovo amministratore
app.post('/admin/crudAdmin/createAdmin', (req, res) => {
    const sql = "INSERT INTO Admin (Nome, Cognome, DataNascita, Citta, Email, Password) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [req.body.nome, req.body.cognome, req.body.dataNascita, req.body.citta, req.body.email, req.body.password];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.status(500).json({ status: "Error", message: "Internal server error" });
        }
        if(data.affectedRows > 0) {
            // Inserimento riuscito
            return res.status(200).json({ 
                status: "Success",
                message: "Admin created"
            });
        } else {
            // Nessun record inserito
            return res.status(404).json({ status: "Failed", message: "No records inserted" });
        }
    })
});

//-------------
//modifica amministratore
app.post('/admin/crudAdmin/modificaAdmin', (req, res) => {
    const sql = "UPDATE Admin SET Admin.Nome = ?, Admin.Cognome = ?, Admin.DataNascita = ?, Admin.Citta = ?, Admin.Email = ?, Admin.Password = ? WHERE Admin.Id_admin = ? ;";
    const values = [req.body.Nome, req.body.Cognome, req.body.DataNascita, req.body.Citta, req.body.Email, req.body.Password, req.body.Id_admin];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.status(500).json({ status: "Error", message: "Internal server error" });
        }
        if(data.affectedRows > 0) {
            // Inserimento riuscito
            return res.status(200).json({ 
                status: "Success",
                modficaAdmin: "Admin modified"
            });
        } else {
            // Nessun record inserito
            return res.status(404).json({ status: "Failed", message: "No records inserted" });
        }
    })
});


//elimina Amministratore 
app.post('/admin/AdminDelete', (req, res) => {
    const sql = "DELETE FROM Admin WHERE Admin.Id_admin = ? ;";
    const values = req.body.Id_admin;

    db.query(sql, values, (err, result) => { 
        if(err) {
            return res.json({ status: "Error", message: "Database error" });
        }
        if(result.affectedRows > 0) {
            return res.json({ 
                status: "Success", 
                message: "Admin deleted successfully"
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//dettagli singolo amministratore
app.get('/admin/getAdminDetails', (req, res) => {
    const adId = req.query.adminId; // Ottenere l'ID utente dalla query string

    const sql = "SELECT * FROM Admin WHERE Id_admin = ? ";
    const values = [adId];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                adminDetails: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});
//---------------

//Messaggio da contatti.js
app.post('/send-email', (req, res) => {
    const sql = "INSERT INTO Contatto (Nome, Email, Messaggio) VALUES (?, ?, ?)";
    const values = [req.body.nome, req.body.email, req.body.messaggio];

    db.query(sql, values, (err, data) => { 
        if(err) {
            console.error("Errore durante l'inserimento nel database:", err);
            return res.status(500).json({ status: "Errore interno del server" });
        }
        
        if(data.affectedRows > 0) {
            console.log("Inserimento nel database.");
            return res.json({ status: "Successo" });
        } else {
            console.error("Nessuna riga inserita nel database.");
            return res.status(400).json({ status: "Operazione fallita" });
        }
    });
});


//vedo messaggi da contatti.js
app.post('/info/recive-email', (req, res) => {
    const sql = "SELECT * FROM Contatto";

    db.query(sql, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            // Prendi solo la prima riga dei risultati
            const firstMessage = data[0];
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                messages: data
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});

//lista User
app.post('/admin/listaUser', (req, res) => {
    const sql = "SELECT * FROM Signup";

    db.query(sql, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            // Prendi solo la prima riga dei risultati
            const firstUser = data[0];
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                users: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});

//nuovo utente
app.post('/admin/crudAdmin/createUser', (req, res) => {
    const sql = "INSERT INTO Signup (Name, Email, Password) VALUES (?, ?, ?)";
    const values = [req.body.nome, req.body.email, req.body.password];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.status(500).json({ status: "Error", message: "Internal server error" });
        }
        if(data.affectedRows > 0) {
            // Inserimento riuscito
            return res.status(200).json({ 
                status: "Success",
                message: "User created"
            });
        } else {
            // Nessun record inserito
            return res.status(404).json({ status: "Failed", message: "No records inserted" });
        }
    })
});

//modifica utente
app.post('/admin/crudAdmin/modificaUser', (req, res) => {
    const sql = "UPDATE Signup SET Signup.Name = ?, Signup.Email= ?, Signup.Password = ? WHERE Signup.Id_signup = ? ;";
    const values = [req.body.Name, req.body.Email, req.body.Password, req.body.Id_signup];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.status(500).json({ status: "Error", message: "Internal server error" });
        }
        if(data.affectedRows > 0) {
            // Inserimento riuscito
            return res.status(200).json({ 
                status: "Success",
                modficaU: "User created"
            });
        } else {
            // Nessun record inserito
            return res.status(404).json({ status: "Failed", message: "No records inserted" });
        }
    })
});

//elimina singolo utente
app.post('/admin/UserDelete', (req, res) => {
    const sql = "DELETE FROM Signup WHERE Signup.Id_signup = ? ;";
    const values = req.body.Id_signup;
    console.log("Sono dentro con id: " + req.body.Id_signup);

    db.query(sql, values, (err, result) => { 
        if(err) {
            return res.json({ status: "Error", message: "Database error" });
        }
        if(result.affectedRows > 0) {
            return res.json({ 
                status: "Success", 
                message: "User deleted successfully"
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//dettagli singolo utente
app.get('/admin/getUserDetails', (req, res) => {
    const userId = req.query.userId; // Ottenere l'ID utente dalla query string

    const sql = "SELECT * FROM Signup WHERE Id_signup = ? ";
    const values = [userId];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            // Prendi solo la prima riga dei risultati
            const firstUser = data[0];
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                userDetails: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//lista Case
app.post('/admin/listaCase', (req, res) => {
    const sql = "SELECT Casa.Id_casa, Casa.Nome, Propietario.Cognome AS Propietario, Agente.Cognome AS Agente, Casa.Paese, Casa.Citta," +
    " Casa.Via, Casa.Descrizione, Casa.Prezzo, Casa.ImageURL FROM Casa INNER JOIN Propietario ON Casa.PropietarioIm = Propietario.Id_propietario"+
    " INNER JOIN Agente ON Casa.AgenteImm = Agente.Id_agente;";

    db.query(sql, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            // Prendi solo la prima riga dei risultati
            const firstUser = data[0];
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                case: data 
            });
        } else {
            return res.json({ status: "Failed", case: "No records found" });
        }
    })
});

//crea una nuova Casa
app.post('/admin/crudAdmin/createCasa', (req, res) => {
    const sql = "INSERT INTO Casa (PropietarioIm, AgenteImm, Nome, Paese, Citta, Via, Prezzo, Descrizione, ImageURL) VALUE (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [req.body.owner, req.body.agente, req.body.nome, req.body.paese, req.body.citta, req.body.via, req.body.prezzo, req.body.descrizione, req.body.immagine];

    db.query(sql, values, (err, data) => { 
        if(err) {
            console.log("Sono dentro ad error");
            return res.status(500).json({ status: "Error", message: "Internal server error" });
        }
        if(data.affectedRows > 0) {
            // Inserimento riuscito
            return res.status(200).json({ 
                status: "Success",
                addcasa: "casa created"
            });
        } else {
            // Nessun record inserito
            return res.status(404).json({ status: "Failed", message: "No records inserted" });
        }
    })
});

//-----
//modifica casa
app.post('/admin/crudAdmin/modificaCasa', (req, res) => {
    const sql = "UPDATE Casa SET Casa.PropietarioIm = ?, Casa.AgenteImm = ?, Casa.Nome = ?, Casa.Paese = ?, Casa.Citta = ?, Casa.Via = ?, Casa.Prezzo = ?, Casa.Descrizione = ?, Casa.ImageURL = ? WHERE Casa.Id_casa = ? ;";
    const values = [req.body.PropietarioIm, req.body.AgenteImm, req.body.Nome, req.body.Paese, req.body.Citta, req.body.Via, req.body.Prezzo, req.body.Descrizione, req.body.ImageURL, req.body.Id_casa];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.status(500).json({ status: "Error", message: "Internal server error" });
        }
        if(data.affectedRows > 0) {
            // Inserimento riuscito
            return res.status(200).json({ 
                status: "Success",
                modficaCasa: "Casa modified"
            });
        } else {
            return res.status(404).json({ status: "Failed", message: "No records inserted" });
        }
    })
});


//elimina casa, con immagini relative
app.post('/admin/CasaDelete', (req, res) => {
    const sql = "DELETE FROM Casa WHERE Casa.Id_casa = ? ; DELETE FROM Immagini_casa WHERE Id_casa = ? ; DELETE FROM CasaVenduta WHERE Id_casa = ? ; ";
    const values = [req.body.Id_casa, req.body.Id_casa, req.body.Id_casa];

    db.query(sql, values, (err, result) => { 
        if(err) {
            return res.json({ status: "Error", message: "Database error" });
        }
        if(result.affectedRows > 0) {
            return res.json({ 
                status: "Success", 
                message: "Casa deleted successfully"
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//elimina singole immagini casa 
app.post('/admin/ImageDelete', (req, res) => {
    const sql = "DELETE FROM Immagini_casa WHERE Id_casa = ? ;";
    const values = req.body.Id_casa;

    db.query(sql, values, (err, result) => { 
        if(err) {
            return res.json({ status: "Error", message: "Database error" });
        }
        if(result.affectedRows > 0) {
            return res.json({ 
                status: "Success", 
                message: "image deleted successfully"
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//lista immagini per singola casa
app.post('/admin/listImage', (req, res) => {
    const sql = "SELECT * FROM Immagini_casa WHERE Immagini_casa.Id_casa = ? ;";
    const values = req.body.casaId;

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json({ status: "Error", message: "Database error" });
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                listImage: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//aggiungi immagine per singola casa
app.post('/admin/crudAdmin/AddImage', (req, res) => {
    const sql = "INSERT INTO Immagini_casa(Id_casa, Nome_file) VALUE (?, ?) ;";
    const values = [req.body.casa, req.body.immagine];

    db.query(sql, values, (err, result) => { 
        if(err) {
            return res.json({ status: "Error", message: "Database error" });
        }
        if(result.affectedRows > 0) {
            return res.json({ 
                status: "Success", 
                message: "Add new image successfully"
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//dettagli singola casa
app.get('/admin/getCasaDetails', (req, res) => {
    const casaId = req.query.houseId; // Ottenere l'ID utente dalla query string

    const sql = "SELECT * FROM Casa WHERE Id_casa = ? ";
    const values = [casaId];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            const Pas = data[0];
            //console.log("getCasaDet: " + Pas.Citta);
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                casaDetails: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});
//----


//lista Agenti Imm.
app.post('/admin/listaAgente', (req, res) => {
    const sql = "SELECT * FROM Agente ;";

    db.query(sql, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            // Prendi solo la prima riga dei risultati
            const firstUser = data[0];
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                agente: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});

//nuovo Agente Imm.
app.post('/admin/crudAdmin/createAgente', (req, res) => {
    const sql = "INSERT INTO Agente (Nome, Cognome, Email, Numero_cell) VALUES (?, ?, ?, ?) ;";
    const values = [req.body.nome, req.body.cognome, req.body.email, req.body.numero_cell];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.status(500).json({ status: "Error", message: "Internal server error" });
        }
        if(data.affectedRows > 0) {
            // Inserimento riuscito
            return res.status(200).json({ 
                status: "Success",
                agente: "agente created"
            });
        } else {
            // Nessun record inserito
            return res.status(404).json({ status: "Failed", message: "No records inserted" });
        }
    })
});

//modifica singolo agente
app.post('/admin/crudAdmin/modificaAgente', (req, res) => {
    const sql = "UPDATE Agente SET Agente.Nome = ?, Agente.Cognome = ?, Agente.Email = ?, Agente.Numero_cell = ? WHERE Agente.Id_agente = ? ;";
    const values = [req.body.Nome, req.body.Cognome, req.body.Email, req.body.Numero_cell, req.body.Id_agente];

    console.log("sono dentro con : " + req.body.Nome);
    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.status(500).json({ status: "Error", message: "Internal server error" });
        }
        if(data.affectedRows > 0) {
            return res.status(200).json({ 
                status: "Success",
                modficaA: "Agente modified"
            });
        } else {
            // Nessun record inserito
            return res.status(404).json({ status: "Failed", message: "No records inserted" });
        }
    })
});

//elimina agente Imm.
app.post('/admin/AgenteDelete', (req, res) => {
    const sql = "DELETE FROM Agente WHERE Agente.Id_agente = ? ;";
    const values = req.body.Id_agente;
    console.log("Sono dentro con id: " + req.body.Id_agente);

    db.query(sql, values, (err, result) => { 
        if(err) {
            return res.json({ status: "Error", message: "Database error" });
        }
        if(result.affectedRows > 0) {
            return res.json({ 
                status: "Success", 
                message: "Agente deleted successfully"
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});

//dettaglli singolo agente Imm.
app.get('/admin/getAgenteDetails', (req, res) => {
    const agenteId = req.query.agenteId; // Ottenere l'ID utente dalla query string

    const sql = "SELECT * FROM Agente WHERE Id_agente = ? ";
    const values = [agenteId];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                agenteDetails: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});

//lista Propierati Imm.
app.post('/admin/listaPropietario', (req, res) => {
    const sql = "SELECT * FROM Propietario ;";

    db.query(sql, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            // Prendi solo la prima riga dei risultati
            const firstUser = data[0];
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                propietario: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});

//nuovo Propietario Imm.
app.post('/admin/crudAdmin/createPropietario', (req, res) => {
    const sql = "INSERT INTO Propietario (Nome, Cognome, Email, Numero_cell) VALUES (?, ?, ?, ?) ;";
    const values = [req.body.nome, req.body.cognome, req.body.email, req.body.numero_cell];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.status(500).json({ status: "Error", message: "Internal server error" });
        }
        if(data.affectedRows > 0) {
            // Inserimento riuscito
            return res.status(200).json({ 
                status: "Success",
                propietario: "propietario created"
            });
        } else {
            // Nessun record inserito
            return res.status(404).json({ status: "Failed", message: "No records inserted" });
        }
    })
});


//modifica propietario
app.post('/admin/crudAdmin/modificaProp', (req, res) => {
    const sql = "UPDATE Propietario SET Propietario.Nome = ?, Propietario.Cognome = ?, Propietario.Email = ?, Propietario.Numero_cell = ? WHERE Propietario.Id_propietario = ? ;";
    const values = [req.body.Nome, req.body.Cognome, req.body.Email, req.body.Numero_cell, req.body.Id_propietario];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.status(500).json({ status: "Error", message: "Internal server error" });
        }
        if(data.affectedRows > 0) {
            // Inserimento riuscito
            return res.status(200).json({ 
                status: "Success",
                modficaP: "Prop modified"
            });
        } else {
            // Nessun record inserito
            return res.status(404).json({ status: "Failed", message: "No records inserted" });
        }
    })
});


//elimina propietario Imm.
app.post('/admin/PropietarioDelete', (req, res) => {
    const sql = "DELETE FROM Propietario WHERE Propietario.Id_propietario = ? ;";
    const values = req.body.Id_propietario;

    db.query(sql, values, (err, result) => { 
        if(err) {
            return res.json({ status: "Error", message: "Database error" });
        }
        if(result.affectedRows > 0) {
            return res.json({ 
                status: "Success", 
                message: "Propietario deleted successfully"
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//dettagli singolo propietario
app.get('/admin/getPropDetails', (req, res) => {
    const propId = req.query.ownerId; // Ottenere l'ID utente dalla query string

    const sql = "SELECT * FROM Propietario WHERE Id_propietario = ? ";
    const values = [propId];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            // Prendi solo la prima riga dei risultati
            const firstUser = data[0];
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                propDetails: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});

//info cliente 
app.get('/Client/InfoClient', (req, res) => {
    const uId = req.query.Id_signup;
    const sql = "SELECT * FROM Signup WHERE Id_signup = ?";
    const values = uId;

    db.query(sql, values, (err, data) => { 
        if(err) {
            console.log("err");
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                uData: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});

//---------------------- ricerca ----------------------------//
//ricerca case da parte del Client => con valori (paese, città)
app.post('/Client/ricercaCase', (req, res) => {
    const sql = "SELECT Casa.Id_casa, Casa.Nome, Propietario.Cognome AS Propietario, Casa.AgenteImm AS IdAgente, Agente.Cognome AS CognomeAgente, " + 
    "Casa.Paese, Casa.Citta, Casa.ImageURL, " +
    "Casa.Via, Casa.Descrizione, Casa.Prezzo FROM Casa INNER JOIN Propietario ON Casa.PropietarioIm = " + "Propietario.Id_propietario INNER JOIN Agente ON Casa.AgenteImm = Agente.Id_agente " + 
    "WHERE Casa.Paese LIKE ? AND Casa.Citta LIKE ? ;" ;
    const values = ["%"+req.body.Paese+"%", "%"+req.body.Citta+"%"];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                ricercaCase: data 
            });
        } else {
            return res.json({ status: "Failed", case: "No records found" });
        }
    })
});

//ricerca case da parte del Client => con valori (paese, città, prezzo)
app.post('/Client/ricercaTuttiCampi', (req, res) => {
    const sql = "SELECT Casa.Id_casa, Casa.Nome, Propietario.Cognome AS Propietario, Casa.AgenteImm AS IdAgente, Agente.Cognome AS CognomeAgente, " + 
    "Casa.Paese, Casa.Citta, Casa.ImageURL, " +
    "Casa.Via, Casa.Descrizione, CAST(Casa.Prezzo AS DECIMAL(10,6)) AS Prezzo FROM Casa INNER JOIN Propietario ON Casa.PropietarioIm = " + "Propietario.Id_propietario INNER JOIN Agente ON Casa.AgenteImm = Agente.Id_agente " + 
    "WHERE Casa.Paese LIKE ? AND Casa.Citta LIKE ? AND (Casa.Prezzo <= ?) ;" ;
    const values = ["%"+req.body.Paese+"%", "%"+req.body.Citta+"%", req.body.Prezzo];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                ricercaCase: data 
            });
        } else {
            return res.json({ status: "Failed", case: "No records found" });
        }
    })
});

//ricerca case da parte del Client => con valori (paese e prezzo)
app.post('/Client/ricercaCasexPaesePrezzo', (req, res) => {
    const sql = "SELECT Casa.Id_casa, Casa.Nome, Propietario.Cognome AS Propietario, Casa.AgenteImm AS IdAgente, Agente.Cognome AS CognomeAgente, " + 
    "Casa.Paese, Casa.Citta, Casa.ImageURL, " +
    "Casa.Via, Casa.Descrizione, CAST(Casa.Prezzo AS DECIMAL(10,6)) AS Prezzo FROM Casa INNER JOIN Propietario ON Casa.PropietarioIm = " + "Propietario.Id_propietario INNER JOIN Agente ON Casa.AgenteImm = Agente.Id_agente " + 
    "WHERE Casa.Paese LIKE ? AND (Casa.Prezzo <= ?) ;" ;
    const values = ["%"+req.body.Paese+"%",req.body.Prezzo];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                ricercaCase: data 
            });
        } else {
            return res.json({ status: "Failed", case: "No records found" });
        }
    })
});


//ricerca case da parte del Client => con valori (città e prezzo)
app.post('/Client/ricercaCasexCittaPrezzo', (req, res) => {
    const sql = "SELECT Casa.Id_casa, Casa.Nome, Propietario.Cognome AS Propietario, Casa.AgenteImm AS IdAgente, Agente.Cognome AS CognomeAgente, " + 
    "Casa.Paese, Casa.Citta, Casa.ImageURL, " +
    "Casa.Via, Casa.Descrizione, CAST(Casa.Prezzo AS DECIMAL(10,6)) AS Prezzo FROM Casa INNER JOIN Propietario ON Casa.PropietarioIm = " + "Propietario.Id_propietario INNER JOIN Agente ON Casa.AgenteImm = Agente.Id_agente " + 
    "WHERE Casa.Citta LIKE ? AND (Casa.Prezzo <= ?) ;" ;
    const values = ["%"+req.body.Citta+"%",req.body.Prezzo];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                ricercaCase: data 
            });
        } else {
            return res.json({ status: "Failed", case: "No records found" });
        }
    })
});

//ricerca case da parte del Client => con valori (paese)
app.post('/Client/ricercaCasexPaese', (req, res) => {
    const sql = "SELECT Casa.Id_casa, Casa.Nome, Propietario.Cognome AS Propietario, Casa.AgenteImm AS IdAgente, Agente.Cognome AS CognomeAgente, " + 
    "Casa.Paese, Casa.Citta, Casa.ImageURL, " +
    "Casa.Via, Casa.Descrizione, Casa.Prezzo FROM Casa INNER JOIN Propietario ON Casa.PropietarioIm = " + "Propietario.Id_propietario INNER JOIN Agente ON Casa.AgenteImm = Agente.Id_agente " + 
    "WHERE Casa.Paese LIKE ? ;" ;
    const values = ["%"+req.body.Paese+"%"];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                ricercaCase: data 
            });
        } else {
            return res.json({ status: "Failed", case: "No records found" });
        }
    })
});

//ricerca case da parte del Client => con valori (città)
app.post('/Client/ricercaCasexCitta', (req, res) => {
    const sql = "SELECT Casa.Id_casa, Casa.Nome, Propietario.Cognome AS Propietario, Casa.AgenteImm AS IdAgente, Agente.Cognome AS CognomeAgente, " + 
    "Casa.Paese, Casa.Citta, Casa.ImageURL, " +
    "Casa.Via, Casa.Descrizione, Casa.Prezzo FROM Casa INNER JOIN Propietario ON Casa.PropietarioIm = " + "Propietario.Id_propietario INNER JOIN Agente ON Casa.AgenteImm = Agente.Id_agente " + 
    "WHERE Casa.Citta LIKE ?;" ;
    const values = ["%"+req.body.Citta+"%"];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                ricercaCase: data 
            });
        } else {
            return res.json({ status: "Failed", case: "No records found" });
        }
    })
});

//ricerca case da parte del Client => con valore (prezzo)
app.post('/Client/ricercaCasexPrezzo', (req, res) => {
    const sql = "SELECT Casa.Id_casa, Casa.Nome, Propietario.Cognome AS Propietario, Casa.AgenteImm AS IdAgente, Agente.Cognome AS CognomeAgente, " + 
    "Casa.Paese, Casa.Citta, Casa.ImageURL, " +
    "Casa.Via, Casa.Descrizione, CAST(Casa.Prezzo AS DECIMAL(10,6)) AS Prezzo FROM Casa INNER JOIN Propietario ON Casa.PropietarioIm = " + "Propietario.Id_propietario INNER JOIN Agente ON Casa.AgenteImm = Agente.Id_agente " + 
    "WHERE (Casa.Prezzo <= ?) ;" ;
    const values = [req.body.Prezzo];

    console.log("Prezzo: " + req.body.Prezzo);
    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                ricercaCase: data 
            });
        } else {
            return res.json({ status: "Failed", case: "No records found" });
        }
    })
});


//lista Agenti Imm x info sulla casa
app.get('/Client/listaAgente', (req, res) => {
    const sql = "SELECT * FROM Agente WHERE Id_agente= ? ;";
    const value = [req.query.Id_agente];

    db.query(sql, value, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                agente: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//lista immagini x gli interni della casa
app.get('/Client/getImage', (req, res) => {
    const sql = "SELECT * FROM Immagini_casa WHERE Id_casa = ? ;";
    const value = [req.query.singleHouseId];

    db.query(sql, value, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                moreImage: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//dettagli singolo agente
app.get('/agente/getAgentDetails', (req, res) => {
    const agentId = req.query.agenteId; 
    const sql = "SELECT * FROM Agente WHERE Id_agente = ? ";
    const values = [agentId];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                agentDetails: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//modifica agente
app.post('/agente/modificaAgente', (req, res) => {
    const sql = "UPDATE Agente SET Agente.Nome = ?, Agente.Cognome = ?, Agente.Email= ?, Agente.Password = ?, Agente.Numero_cell = ? WHERE Agente.Id_agente = ? ;";
    const values = [req.body.Nome, req.body.Cognome, req.body.Email, req.body.Password, req.body.Numero_cell, req.body.Id_agente];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.status(500).json({ status: "Error", message: "Internal server error" });
        }
        if(data.affectedRows > 0) {
            // Inserimento riuscito
            return res.status(200).json({ 
                status: "Success",
                modficaA: "Agent created"
            });
        } else {
            // Nessun record inserito
            return res.status(404).json({ status: "Failed", message: "No records inserted" });
        }
    })
});


//lista messaggi dei clienti all'agente
app.post('/agente/listaMessaggi', (req, res) => {
    const sql = "SELECT * FROM RichiesteXMessaggio WHERE Id_agente = ? ;";
    const value = req.body.Id_agente;

    db.query(sql, value, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                Messaggi: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//elimina messagi cliente all'agente.
app.post('/agente/MsgDelete', (req, res) => {
    const sql = "DELETE FROM RichiesteXMessaggio WHERE RichiesteXMessaggio.Id_msg = ? ;";
    const values = req.body.Id_msg;

    db.query(sql, values, (err, result) => { 
        if(err) {
            return res.json({ status: "Error", message: "Database error" });
        }
        if(result.affectedRows > 0) {
            return res.json({ 
                status: "Success", 
                message: "Messaggio deleted successfully"
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//invia messagio all'agente da parte del cliente.
app.post('/Client/InviaMessaggio', (req, res) => {
    const sql = "INSERT INTO RichiesteXMessaggio (Email_richiedente, Id_agente, Titolo, Descrizione_msg) VALUE (?, ?, ?, ?);";
    const values = [req.body.Email_richiedente, req.body.Id_agente, req.body.Titolo, req.body.Descrizione_msg];

    db.query(sql, values, (err, result) => { 
        if(err) {
            return res.json({ status: "Error", message: "Database error" });
        }
        if(result.affectedRows > 0) {
            return res.json({ 
                status: "Success", 
                InviaMessaggio: "Messaggio updated successfully"
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//lista Case x agente
app.post('/agente/listaCaseXAgente', (req, res) => {
    const sql = "SELECT Casa.Id_casa, Casa.Nome, Propietario.Cognome AS Propietario, Agente.Cognome AS Agente, Casa.Paese, Casa.Citta," +
    " Casa.Via, Casa.Descrizione, Casa.Prezzo, Casa.ImageURL FROM Casa INNER JOIN Propietario ON Casa.PropietarioIm = Propietario.Id_propietario"+
    " INNER JOIN Agente ON Casa.AgenteImm = Agente.Id_agente WHERE Agente.Id_agente = ? ORDER BY Casa.Id_casa;";
    const values = req.body.Id_agente;
    
    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                casexagente: data 
            });
        } else {
            return res.json({ status: "Failed", case: "No records found" });
        }
    })
});


//aggiungi casa venduta da agente
app.get('/agente/AddCasaVenduta', (req, res) => {
    const casaVendId = req.query.Id_casa;

    const sql = "INSERT INTO CasaVenduta (Id_casa) VALUES (?) ;" ;
    const values = [casaVendId];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.affectedRows > 0) {
            return res.json({ 
                status: "Success",
                message: "Sold House created"
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//lista case vendute viste da admin
app.post('/admin/ListaCaseVendute', (req, res) => {
    const sql = "SELECT CasaVenduta.Id_venduta, Casa.Nome, Casa.Via " +
    "FROM CasaVenduta INNER JOIN Casa ON CasaVenduta.Id_casa = Casa.Id_casa;";

    db.query(sql, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json({ 
                status: "Success", 
                numRecord: data.length, 
                caseVendute: data 
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});


//elimina casa venduta da agente
app.post('/admin/DeleteCasaVenduta', (req, res) => {
    const casaVendId = req.body.Id_venduta;

    const sql = "DELETE FROM CasaVenduta WHERE CasaVenduta.Id_venduta = ? ;";
    const values = [casaVendId];

    db.query(sql, values, (err, data) => { 
        if(err) {
            return res.json("Error");
        }
        if(data.affectedRows > 0) {
            return res.json({ 
                status: "Success",
                message: "Casa Venduta deleted"
            });
        } else {
            return res.json({ status: "Failed", message: "No records found" });
        }
    })
});




app.listen(8081, () => {
    console.log("Listening...");
})
