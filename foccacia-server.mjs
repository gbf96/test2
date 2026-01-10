import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import cors from 'cors';
import hbs from 'hbs';
import cookieParser from 'cookie-parser'; 
import path from 'path';
import url from 'url';
import session from 'express-session';
import passport from 'passport';


import * as foccaciaDataLayer from './data/foccacia-data-elastic.mjs'; 
import * as foccaciaDataMemLayer from './data/foccacia-data-mem.mjs'; 
import * as fapiDataLayer from './data/fapi-teams-data.mjs'; 
import servicesInit from './services/foccacia-services.mjs';
import servicesApiInit from './services/foccacia-services-api.mjs';
import webApiInit from './foccacia-web-api.mjs';
import webSiteInit from './foccacia-web-site.mjs'; 

const HOST = "localhost";
const PORT = 3000;

const CURRENT_DIR = url.fileURLToPath(new URL('.', import.meta.url));
const PATH_PUBLIC = path.join(CURRENT_DIR, 'public'); 
const PATH_VIEWS = path.join(CURRENT_DIR, 'views');
const PATH_PARTIALS = path.join(PATH_VIEWS, 'partials'); 

let services;
let servicesApi;
let webApi;
let webSite;

try {
  services = servicesInit(foccaciaDataLayer, fapiDataLayer); 
  servicesApi = servicesApiInit(foccaciaDataMemLayer, fapiDataLayer); 
  webApi = webApiInit(servicesApi);
  webSite = webSiteInit(services);
}
catch (err) {
  console.error(err);
}

if (services && webApi && webSite && servicesApi) {

  const app = express();

  // Swagger UI
  const swaggerDocument = yaml.load('./docs/foccacia-api-spec.yaml'); 
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Static Files
  app.use(express.static(PATH_PUBLIC));

  app.set('views', PATH_VIEWS);
  app.set('view engine', 'hbs');

  hbs.registerPartials(PATH_PARTIALS);
  
  hbs.registerHelper('lt', (a, b) => a < b);
  
  app.use(cors()); 
  app.use(express.urlencoded({extended: true})); 
  app.use(express.json()); 
  app.use(cookieParser()); 

  app.use(session({
    secret: 'foccacia-secret-key', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user.userId); 
  });

  passport.deserializeUser(async (userId, done) => {
    try {
      const user = await foccaciaDataLayer.getUserById(userId); 
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  app.get("/", (req, res) => res.redirect("/groups"));

  // API Routes
  app.post("/api/users", webApi.createUser);
  app.get("/api/competitions", webApi.listCompetitions);
  
  // Rotas de Grupos API
  app.post("/api/groups", webApi.authMiddleware, webApi.createGroup);
  app.get("/api/groups", webApi.authMiddleware, webApi.listGroups);
  app.get("/api/groups/:competition/:year", webApi.authMiddleware, webApi.getGroup);
  app.put("/api/groups/:competition/:year", webApi.authMiddleware, webApi.editGroup);
  app.delete("/api/groups/:competition/:year", webApi.authMiddleware, webApi.deleteGroup);
  
  // Rotas de Players API
  app.post("/api/groups/:competition/:year/players", webApi.authMiddleware, webApi.addPlayerToGroup);
  app.delete("/api/groups/:competition/:year/players/:playerId", webApi.authMiddleware, webApi.removePlayerFromGroup);
  
  // Rota de Teams API
  app.get("/api/teams/:competition/:year", webApi.getTeamsByCompetition);

  // --- ROTAS DE AUTENTICAÇÃO (SITE) ---
  
  // Login
  app.get("/login", webSite.showLogin);
  app.post("/login", webSite.processLogin);
  
  // Registo 
  app.get("/register", webSite.showRegister);
  app.post("/register", webSite.processRegister);

  // Logout
  app.post('/logout', webSite.logout);

  app.use("/groups", webSite.siteAuthMiddleware);

  // Grupos
  app.get("/groups", webSite.listGroups);
  app.get("/groups/new", webSite.showCreateGroup);
  app.post("/groups/new", webSite.processCreateGroup);
  
  // Detalhes e Ações
  app.get("/groups/:competition/:year", webSite.showGroupDetails);
  app.post("/groups/:competition/:year/delete", webSite.processDeleteGroup); 
  
  app.get("/groups/:competition/:year/edit", webSite.showUpdateGroup);
  app.post("/groups/:competition/:year/edit", webSite.processUpdateGroup); 

  // Jogadores
  app.get("/groups/:competition/:year/add-player", webSite.searchPlayers);
  app.post("/groups/:competition/:year/add-player", webSite.processAddPlayer);
  app.post("/groups/:competition/:year/players/:playerId/delete", webSite.processRemovePlayer);

  app.get("/competitions", webSite.listAvailableCompetitions);
  app.get("/competitions/:id/teams", webSite.listTeamsByCompetition);

  app.listen(PORT, () =>
    console.log(`FOCCACIA app listening in http://${HOST}:${PORT}`),
  );
}