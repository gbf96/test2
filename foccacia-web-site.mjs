export default function init(services) {
    return {
        siteAuthMiddleware,
        showLogin,
        processLogin,
        showRegister,      // Nova função para mostrar o registo
        processRegister,   // Nova função para processar o registo
        home,
        listGroups,
        showCreateGroup,
        processCreateGroup,
        showGroupDetails,
        processDeleteGroup,
        showUpdateGroup,
        processUpdateGroup,
        searchPlayers,
        processAddPlayer,
        processRemovePlayer,
        logout,
        listAvailableCompetitions,
        listTeamsByCompetition
    };

    // Função auxiliar para tratamento de erros
    async function handleRequest(req, res, action, onError) {
        try {
            await action();
        } catch (err) {
            const message = err.description || err.message || "An unexpected error occurred.";           
            if (onError) {
                await onError(message);
            } else {
                console.error("Unhandled error:", message);
                // Renderiza a view de grupos com erro genérico se não houver handler específico
                res.render('groupsView', { error: message, user: req.user });
            }
        }
    }
 
    // 1. Middleware de Autenticação com Passport
    async function siteAuthMiddleware(req, res, next) {
        // req.isAuthenticated() é fornecido pelo Passport
        if (req.isAuthenticated()) {
            res.locals.user = req.user; // Disponibiliza o user para todas as views
            return next();
        }
        // Se não estiver autenticado, redireciona para login
        res.redirect('/login');
    }

    // 2. Mostrar Login (isRegister: false)
    function showLogin(req, res) {
        if (req.isAuthenticated()) return res.redirect('/groups');
        
        // Reutiliza a view loginView, indicando que NÃO é registo
        res.render('loginView', { 
            title: 'Login - FOCCACIA', 
            isRegister: false 
        });
    }

    // 3. Processar Login com req.login
    async function processLogin(req, res, next) {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.render('loginView', { 
                title: 'Login - FOCCACIA',
                error: "Username and password are required", 
                isRegister: false 
            });
        }

        try {
            // Verifica as credenciais (Assume que services.verifyUser foi criado conforme passo anterior)
            // Se não criou verifyUser, pode usar services.getUser(username) e comparar user.password == password
            const user = await services.verifyUser(username, password);
            
            if (!user) {
                return res.render('loginView', { 
                    title: 'Login - FOCCACIA',
                    error: "Invalid username or password", 
                    isRegister: false 
                });
            }

            // Passport: Cria a sessão manualmente
            req.login(user, (err) => {
                if (err) return next(err);
                return res.redirect('/groups');
            });

        } catch (err) {
            // Em caso de erro técnico
            res.render('loginView', { 
                title: 'Login - FOCCACIA',
                error: "Login failed: " + err.message, 
                isRegister: false 
            });
        }
    }

    // 4. Mostrar Registo (isRegister: true)
    function showRegister(req, res) {
        if (req.isAuthenticated()) return res.redirect('/groups');

        // Reutiliza a mesma view, mas ativa o modo de registo
        res.render('loginView', { 
            title: 'Register - FOCCACIA', 
            isRegister: true 
        });
    }

    // 5. Processar Registo e Auto-Login
    async function processRegister(req, res, next) {
        const { username, password } = req.body;

        try {
            // Cria o utilizador (Assume que services.createUser aceita password agora)
            const newUser = await services.createUser(username, password);
            
            // Passport: Login automático após registo
            req.login(newUser, (err) => {
                if (err) return next(err);
                res.redirect('/groups');
            });
        } catch (err) {
            // Se o utilizador já existir ou houver outro erro, volta ao form de registo
            res.render('loginView', { 
                title: 'Register - FOCCACIA',
                error: err.message, // Ex: "User already exists"
                isRegister: true 
            });
        }
    }

    // 6. Logout com req.logout
    function logout(req, res, next) {
        req.logout((err) => {
            if (err) { return next(err); }
            res.redirect('/login');
        });
    }

    function home(req, res) {
        res.redirect('/groups');
    }

    async function listGroups(req, res) {
        await handleRequest(req, res, 
            async () => {
                const groups = await services.getGroupsForUser(req.user);
                res.render('groupsView', { title: 'My Groups', groups });
            },
            (errorMsg) => {
                res.render('groupsView', { error: errorMsg, groups: [] });
            }
        );
    }

    async function showGroupDetails(req, res) {
        const { competition, year } = req.params;
        await handleRequest(req, res,
            async () => {
                const group = await services.getGroup(req.user, competition, parseInt(year));
                res.render('groupDetailsView', { title: group.name, group });
            },
            () => res.redirect('/groups') 
        );
    }

    async function showCreateGroup(req, res) {
        await handleRequest(req, res,
            async () => {
                const competitions = await services.getCompetitions();
                res.render('createGroupView', { title: 'New Group', competitions });
            },
            (errorMsg) => {
                res.render('groupsView', { error: "Could not load competitions: " + errorMsg });
            }
        );
    }

    async function processCreateGroup(req, res) {
        const { name, description, competition, year } = req.body;
        
        await handleRequest(req, res,
            async () => {
                await services.createGroup(req.user, { name, description, competition, year: parseInt(year) });
                res.redirect('/groups');
            },
            async (errorMsg) => {
                const competitions = await services.getCompetitions();
                res.render('createGroupView', { 
                    title: 'New Group',
                    error: errorMsg, 
                    competitions,
                    name, description, competition, year
                });
            }
        );
    }

    async function processDeleteGroup(req, res) {
        const { competition, year } = req.params;
        await handleRequest(req, res,
            async () => {
                await services.deleteGroup(req.user, competition, parseInt(year));
                res.redirect('/groups');
            },
            () => res.redirect(`/groups/${competition}/${year}`) 
        );
    }

    async function showUpdateGroup(req, res) {
        const { competition, year } = req.params;
        await handleRequest(req, res,
            async () => {
                const group = await services.getGroup(req.user, competition, parseInt(year));
                res.render('editGroupView', { title: 'Edit Group', group });
            },
            () => res.redirect('/groups')
        );
    }

    async function processUpdateGroup(req, res) {
        const { competition, year } = req.params;
        const { name, description } = req.body;
        
        await handleRequest(req, res,
            async () => {
                await services.editGroup(req.user, competition, parseInt(year), { name, description });
                res.redirect(`/groups/${competition}/${year}`);
            },
            (errorMsg) => {
                res.render('editGroupView', { 
                    error: errorMsg, 
                    group: { competition, year, name, description } 
                });
            }
        );
    }

    async function searchPlayers(req, res) {
        const { competition, year } = req.params;
        try {
            const allTeams = await services.getTeams(competition, parseInt(year));
            
            res.render('searchPlayersView', { 
                title: 'Add player', 
                competition, 
                year, 
                teams: allTeams 
            });
        } catch (err) {
            res.render('groupDetailsView', { 
                error: "Error loading player list." 
            }); 
        }
    }

    async function processAddPlayer(req, res) {
        const { competition, year } = req.params;
        const { playerId, teamId } = req.body; 

        await handleRequest(req, res,
            async () => {
                await services.addPlayerToGroup(req.user, competition, parseInt(year), { 
                    playerId: parseInt(playerId), 
                    teamId: parseInt(teamId) 
                });
                res.redirect(`/groups/${competition}/${year}`);
            },
            async (errorMsg) => {
                try {
                    const group = await services.getGroup(req.user, competition, parseInt(year));
                    res.render('groupDetailsView', { title: group.name, group, error: errorMsg });
                } catch (e) {
                    res.redirect('/groups');
                }
            }
        );
    }

    async function processRemovePlayer(req, res) {
        const { competition, year, playerId } = req.params;
        try {
            await services.removePlayerFromGroup(req.user, competition, parseInt(year), parseInt(playerId));
        } catch (e) {
            console.log("Error removing player:", e.message);
        }
        res.redirect(`/groups/${competition}/${year}`);
    }

    async function listAvailableCompetitions(req, res) {
        await handleRequest(req, res,
            async () => {
                const competitions = await services.getCompetitions();
                res.render('competitionsListView', { 
                    title: 'Available Competitions', 
                    competitions, 
                    hideNav: true 
                });
            },
            (errorMsg) => res.render('groupsView', { error: "Error loading competitions." })
        );
    }

    async function listTeamsByCompetition(req, res) {
        const competitionId = req.params.id;
        const year = req.query.year || 2025;
        const competitionName = req.query.name;

        await handleRequest(req, res,
            async () => {
                const teams = await services.getTeams(competitionId, parseInt(year));
                res.render('teamsListView', { 
                    title: `Teams for ${competitionName} - ${year}`, 
                    teams, competitionId, year,
                    hideNav: true 
                });
            },
            (errorMsg) => res.render('competitionsListView', { 
                error: "Error loading teams.", 
                hideNav: true 
            })
        );
    }
}