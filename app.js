// EduConnect - Plataforma de Mentorias
class EduConnect {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('educonnect_users')) || [];
        this.mentors = JSON.parse(localStorage.getItem('educonnect_mentors')) || this.getDefaultMentors();
        this.groups = JSON.parse(localStorage.getItem('educonnect_groups')) || this.getDefaultGroups();
        this.materials = JSON.parse(localStorage.getItem('educonnect_materials')) || this.getDefaultMaterials();
        this.sessions = JSON.parse(localStorage.getItem('educonnect_sessions')) || [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkAuthState();
        this.saveToStorage();
    }
    
    // Configuração de Event Listeners
    setupEventListeners() {
        // Abas de autenticação
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.tab));
        });
        
        // Formulários
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        
        // Navegação
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(e.target.dataset.section);
            });
        });
        
        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        
        // Busca de mentores
        document.getElementById('mentor-search').addEventListener('input', (e) => this.searchMentors(e.target.value));
        
        // Botões de ação
        document.getElementById('create-group-btn').addEventListener('click', () => this.openModal('group-modal'));
        document.getElementById('upload-material-btn').addEventListener('click', () => this.openModal('material-modal'));
        
        // Formulários dos modais
        document.getElementById('group-form').addEventListener('submit', (e) => this.createGroup(e));
        document.getElementById('material-form').addEventListener('submit', (e) => this.uploadMaterial(e));
        document.getElementById('schedule-form').addEventListener('submit', (e) => this.scheduleSession(e));
        
        // Gerenciamento de participantes
        document.getElementById('participant-search').addEventListener('input', (e) => this.searchUsers(e.target.value));
        
        // Fechar modais
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
        
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
    }
    
    // Autenticação
    switchAuthTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-form`).classList.add('active');
    }
    
    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('educonnect_current_user', JSON.stringify(user));
            this.showMessage('login-message', 'Login realizado com sucesso!', 'success');
            setTimeout(() => this.showMainScreen(), 1000);
        } else {
            this.showMessage('login-message', 'Email ou senha incorretos!', 'error');
        }
    }
    
    handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const type = document.getElementById('register-type').value;
        
        if (this.users.find(u => u.email === email)) {
            this.showMessage('register-message', 'Email já cadastrado!', 'error');
            return;
        }
        
        const user = {
            id: Date.now(),
            name,
            email,
            password,
            type,
            avatar: name.charAt(0).toUpperCase(),
            bio: type === 'mentor' ? 'Mentor experiente pronto para ajudar.' : 'Estudante em busca de conhecimento.',
            expertise: type === 'mentor' ? ['Programação', 'Design'] : []
        };
        
        this.users.push(user);
        
        if (type === 'mentor') {
            this.mentors.push({
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                bio: user.bio,
                expertise: user.expertise,
                rating: 5.0,
                sessions: 0,
                availability: ['09:00', '10:00', '14:00', '15:00']
            });
        }
        
        this.saveToStorage();
        this.showMessage('register-message', 'Cadastro realizado com sucesso!', 'success');
        setTimeout(() => this.switchAuthTab('login'), 1500);
    }
    
    checkAuthState() {
        const savedUser = localStorage.getItem('educonnect_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainScreen();
        }
    }
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('educonnect_current_user');
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('main-screen').classList.remove('active');
    }
    
    // Navegação
    showMainScreen() {
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        document.getElementById('user-name').textContent = this.currentUser.name;
        this.showSection('dashboard');
        this.loadDashboard();
    }
    
    showSection(sectionName) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        document.getElementById(`${sectionName}-section`).classList.add('active');
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'mentors':
                this.loadMentors();
                break;
            case 'groups':
                this.loadGroups();
                break;
            case 'materials':
                this.loadMaterials();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    }
    
    // Dashboard
    loadDashboard() {
        this.loadUpcomingSessions();
        this.loadMyGroups();
        this.loadRecentMaterials();
    }
    
    loadUpcomingSessions() {
        const userSessions = this.sessions.filter(s => s.studentId === this.currentUser.id);
        const container = document.getElementById('upcoming-sessions');
        
        if (userSessions.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhuma mentoria agendada</p>';
            return;
        }
        
        container.innerHTML = userSessions.slice(0, 3).map(session => {
            const mentor = this.mentors.find(m => m.id === session.mentorId);
            return `
                <div class="session-item">
                    <strong>${mentor.name}</strong><br>
                    <small>${session.date} às ${session.time}</small>
                </div>
            `;
        }).join('');
    }
    
    loadMyGroups() {
        const userGroups = this.groups.filter(g => 
            g.members.includes(this.currentUser.id) || g.createdBy === this.currentUser.id
        );
        const container = document.getElementById('my-groups');
        
        if (userGroups.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhum grupo encontrado</p>';
            return;
        }
        
        container.innerHTML = userGroups.slice(0, 3).map(group => `
            <div class="group-item">
                <strong>${group.name}</strong><br>
                <small>${group.members.length} membros</small>
            </div>
        `).join('');
    }
    
    loadRecentMaterials() {
        const container = document.getElementById('recent-materials');
        
        if (this.materials.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhum material disponível</p>';
            return;
        }
        
        container.innerHTML = this.materials.slice(0, 3).map(material => `
            <div class="material-item">
                <strong>${material.name}</strong><br>
                <small>Enviado por ${material.uploaderName}</small>
            </div>
        `).join('');
    }
    
    // Mentores
    loadMentors() {
        this.renderMentors(this.mentors);
    }
    
    renderMentors(mentors) {
        const container = document.getElementById('mentors-grid');
        
        if (mentors.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Nenhum mentor encontrado</p></div>';
            return;
        }
        
        container.innerHTML = mentors.map(mentor => `
            <div class="mentor-card" onclick="app.showMentorDetails(${mentor.id})">
                <div class="mentor-photo">
                    <img src="${mentor.photo}" alt="${mentor.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                    <div class="mentor-avatar" style="display:none;">${mentor.avatar}</div>
                </div>
                <div class="mentor-info">
                    <h3>${mentor.name}</h3>
                    <p>${mentor.bio}</p>
                    <div class="mentor-stats">
                        <span><i class="fas fa-star"></i> ${mentor.rating}</span>
                        <span><i class="fas fa-user-graduate"></i> ${mentor.sessions} sessões</span>
                    </div>
                    <div class="mentor-expertise">
                        ${mentor.expertise.map(skill => `<span class="expertise-tag">${skill}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    searchMentors(query) {
        const filtered = this.mentors.filter(mentor => 
            mentor.name.toLowerCase().includes(query.toLowerCase()) ||
            mentor.expertise.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
        );
        this.renderMentors(filtered);
    }
    
    showMentorDetails(mentorId) {
        const mentor = this.mentors.find(m => m.id === mentorId);
        const modal = document.getElementById('mentor-modal');
        
        document.getElementById('modal-mentor-name').textContent = mentor.name;
        document.getElementById('mentor-modal-body').innerHTML = `
            <div class="mentor-profile">
                <div class="mentor-profile-photo">
                    <img src="${mentor.photo}" alt="${mentor.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                    <div class="mentor-avatar" style="width: 100px; height: 100px; margin: 0 auto 1rem; display:none;">${mentor.avatar}</div>
                </div>
                <h4>Sobre</h4>
                <p>${mentor.bio}</p>
                
                <h4>Áreas de Expertise</h4>
                <div class="mentor-expertise">
                    ${mentor.expertise.map(skill => `<span class="expertise-tag">${skill}</span>`).join('')}
                </div>
                
                <h4>Estatísticas</h4>
                <div class="mentor-stats">
                    <p><i class="fas fa-star"></i> Avaliação: ${mentor.rating}/5</p>
                    <p><i class="fas fa-user-graduate"></i> Sessões realizadas: ${mentor.sessions}</p>
                </div>
                
                <div style="margin-top: 2rem;">
                    <button class="btn btn-primary" onclick="app.openScheduleModal(${mentorId})">
                        <i class="fas fa-calendar-plus"></i> Agendar Mentoria
                    </button>
                </div>
            </div>
        `;
        
        this.openModal('mentor-modal');
    }
    
    openScheduleModal(mentorId) {
        this.closeModal();
        this.selectedMentorId = mentorId;
        
        // Configurar data mínima como hoje
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('schedule-date').min = today;
        
        this.openModal('schedule-modal');
    }
    
    scheduleSession(e) {
        e.preventDefault();
        const date = document.getElementById('schedule-date').value;
        const time = document.getElementById('schedule-time').value;
        
        const session = {
            id: Date.now(),
            studentId: this.currentUser.id,
            mentorId: this.selectedMentorId,
            date,
            time,
            status: 'scheduled'
        };
        
        this.sessions.push(session);
        this.saveToStorage();
        
        const mentor = this.mentors.find(m => m.id === this.selectedMentorId);
        alert(`Mentoria agendada com ${mentor.name} para ${date} às ${time}!`);
        
        this.closeModal();
        this.loadDashboard();
    }
    
    // Grupos de Estudo
    loadGroups() {
        const container = document.getElementById('groups-grid');
        
        if (this.groups.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>Nenhum grupo criado ainda</p></div>';
            return;
        }
        
        container.innerHTML = this.groups.map(group => `
            <div class="group-card">
                <div class="group-info">
                    <h3>${group.name}</h3>
                    <p>${group.description}</p>
                    <div class="group-stats">
                        <span><i class="fas fa-users"></i> ${group.members.length} membros</span>
                        <span><i class="fas fa-user"></i> Criado por ${group.creatorName}</span>
                    </div>
                    <div class="group-actions">
                        ${!group.members.includes(this.currentUser.id) ? 
                            `<button class="btn btn-primary btn-small" onclick="app.joinGroup(${group.id})">Participar</button>` :
                            `<button class="btn btn-secondary btn-small">Membro</button>`
                        }
                        ${(group.createdBy === this.currentUser.id || group.members.includes(this.currentUser.id)) ? 
                            `<button class="btn btn-outline btn-small" onclick="app.openGroupManagement(${group.id})">
                                <i class="fas fa-cog"></i> Gerenciar
                            </button>` : ''
                        }
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    createGroup(e) {
        e.preventDefault();
        const name = document.getElementById('group-name').value;
        const description = document.getElementById('group-description').value;
        
        const group = {
            id: Date.now(),
            name,
            description,
            createdBy: this.currentUser.id,
            creatorName: this.currentUser.name,
            members: [this.currentUser.id],
            createdAt: new Date().toISOString()
        };
        
        this.groups.push(group);
        this.saveToStorage();
        
        alert('Grupo criado com sucesso!');
        this.closeModal();
        this.loadGroups();
        
        // Limpar formulário
        e.target.reset();
    }
    
    joinGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group && !group.members.includes(this.currentUser.id)) {
            group.members.push(this.currentUser.id);
            this.saveToStorage();
            alert('Você entrou no grupo!');
            this.loadGroups();
        }
    }
    
    // Gerenciamento de Participantes
    openGroupManagement(groupId) {
        this.selectedGroupId = groupId;
        const group = this.groups.find(g => g.id === groupId);
        
        document.getElementById('manage-group-name').textContent = `Gerenciar: ${group.name}`;
        this.loadCurrentParticipants();
        this.loadAvailableUsers();
        
        this.openModal('group-manage-modal');
    }
    
    loadCurrentParticipants() {
        const group = this.groups.find(g => g.id === this.selectedGroupId);
        const container = document.getElementById('current-participants');
        
        if (group.members.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhum participante</p>';
            return;
        }
        
        const participants = group.members.map(memberId => {
            const user = this.users.find(u => u.id === memberId) || 
                         this.mentors.find(m => m.id === memberId);
            return user || { id: memberId, name: 'Usuário não encontrado', avatar: '?' };
        });
        
        container.innerHTML = participants.map(user => `
            <div class="participant-item">
                <div class="participant-info">
                    <div class="participant-avatar">${user.avatar}</div>
                    <span class="participant-name">${user.name}</span>
                    ${user.id === group.createdBy ? '<span class="expertise-tag">Criador</span>' : ''}
                </div>
                <div class="participant-actions">
                    ${user.id !== group.createdBy && group.createdBy === this.currentUser.id ? 
                        `<button class="btn btn-danger btn-small" onclick="app.removeParticipant(${user.id})">
                            <i class="fas fa-times"></i>
                        </button>` : ''
                    }
                </div>
            </div>
        `).join('');
    }
    
    loadAvailableUsers() {
        const group = this.groups.find(g => g.id === this.selectedGroupId);
        const container = document.getElementById('available-users');
        
        // Combinar usuários e mentores, excluindo os que já estão no grupo
        const allUsers = [...this.users, ...this.mentors]
            .filter(user => !group.members.includes(user.id))
            .filter((user, index, self) => self.findIndex(u => u.id === user.id) === index); // Remove duplicatas
        
        if (allUsers.length === 0) {
            container.innerHTML = '<p class="empty-state">Todos os usuários já estão no grupo</p>';
            return;
        }
        
        this.renderAvailableUsers(allUsers);
    }
    
    renderAvailableUsers(users) {
        const container = document.getElementById('available-users');
        
        container.innerHTML = users.map(user => `
            <div class="participant-item">
                <div class="participant-info">
                    <div class="participant-avatar">${user.avatar}</div>
                    <span class="participant-name">${user.name}</span>
                    <span class="expertise-tag">${user.type === 'mentor' ? 'Mentor' : 'Aluno'}</span>
                </div>
                <div class="participant-actions">
                    <button class="btn btn-success btn-small" onclick="app.addParticipant(${user.id})">
                        <i class="fas fa-plus"></i> Adicionar
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    searchUsers(query) {
        const group = this.groups.find(g => g.id === this.selectedGroupId);
        
        const allUsers = [...this.users, ...this.mentors]
            .filter(user => !group.members.includes(user.id))
            .filter((user, index, self) => self.findIndex(u => u.id === user.id) === index)
            .filter(user => user.name.toLowerCase().includes(query.toLowerCase()));
        
        this.renderAvailableUsers(allUsers);
    }
    
    addParticipant(userId) {
        const group = this.groups.find(g => g.id === this.selectedGroupId);
        const user = this.users.find(u => u.id === userId) || this.mentors.find(m => m.id === userId);
        
        if (group && user && !group.members.includes(userId)) {
            group.members.push(userId);
            this.saveToStorage();
            
            alert(`${user.name} foi adicionado ao grupo!`);
            this.loadCurrentParticipants();
            this.loadAvailableUsers();
            this.loadGroups();
        }
    }
    
    removeParticipant(userId) {
        const group = this.groups.find(g => g.id === this.selectedGroupId);
        const user = this.users.find(u => u.id === userId) || this.mentors.find(m => m.id === userId);
        
        if (group && user && group.createdBy === this.currentUser.id) {
            const confirmRemove = confirm(`Remover ${user.name} do grupo?`);
            
            if (confirmRemove) {
                group.members = group.members.filter(id => id !== userId);
                this.saveToStorage();
                
                alert(`${user.name} foi removido do grupo!`);
                this.loadCurrentParticipants();
                this.loadAvailableUsers();
                this.loadGroups();
            }
        }
    }
    
    // Materiais
    loadMaterials() {
        const container = document.getElementById('materials-list');
        
        if (this.materials.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-file"></i><p>Nenhum material disponível</p></div>';
            return;
        }
        
        container.innerHTML = this.materials.map(material => `
            <div class="material-item">
                <div class="material-info">
                    <h4>${material.name}</h4>
                    <p>${material.description}</p>
                    <small>Enviado por ${material.uploaderName} em ${new Date(material.uploadDate).toLocaleDateString()}</small>
                </div>
                <div class="material-actions">
                    <button class="btn btn-outline" onclick="app.downloadMaterial(${material.id})">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    uploadMaterial(e) {
        e.preventDefault();
        const name = document.getElementById('material-name').value;
        const description = document.getElementById('material-description').value;
        const file = document.getElementById('material-file').files[0];
        
        if (!file) {
            alert('Selecione um arquivo!');
            return;
        }
        
        const material = {
            id: Date.now(),
            name,
            description,
            fileName: file.name,
            fileSize: file.size,
            uploaderId: this.currentUser.id,
            uploaderName: this.currentUser.name,
            uploadDate: new Date().toISOString()
        };
        
        this.materials.push(material);
        this.saveToStorage();
        
        alert('Material enviado com sucesso!');
        this.closeModal();
        this.loadMaterials();
        
        // Limpar formulário
        e.target.reset();
    }
    
    downloadMaterial(materialId) {
        const material = this.materials.find(m => m.id === materialId);
        alert(`Download iniciado: ${material.fileName} (${(material.fileSize / 1024).toFixed(1)} KB)`);
    }
    
    // Perfil
    loadProfile() {
        const container = document.getElementById('profile-content');
        
        container.innerHTML = `
            <div class="profile-card">
                <div class="profile-avatar">${this.currentUser.avatar}</div>
                <h3>${this.currentUser.name}</h3>
                <p>${this.currentUser.email}</p>
                <p><strong>Tipo:</strong> ${this.currentUser.type === 'student' ? 'Aluno' : 'Mentor'}</p>
                <p>${this.currentUser.bio}</p>
                
                ${this.currentUser.type === 'mentor' ? `
                    <div class="mentor-expertise">
                        ${this.currentUser.expertise.map(skill => `<span class="expertise-tag">${skill}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div style="margin-top: 2rem;">
                    <button class="btn btn-primary">Editar Perfil</button>
                </div>
            </div>
        `;
    }
    
    // Modais
    openModal(modalId) {
        document.getElementById('modal-overlay').classList.add('active');
        document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
        document.getElementById(modalId).style.display = 'block';
    }
    
    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    }
    
    // Utilidades
    showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `form-message ${type}`;
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
    
    saveToStorage() {
        localStorage.setItem('educonnect_users', JSON.stringify(this.users));
        localStorage.setItem('educonnect_mentors', JSON.stringify(this.mentors));
        localStorage.setItem('educonnect_groups', JSON.stringify(this.groups));
        localStorage.setItem('educonnect_materials', JSON.stringify(this.materials));
        localStorage.setItem('educonnect_sessions', JSON.stringify(this.sessions));
    }
    
    // Dados padrão dos mentores
    getDefaultMentors() {
        return [
            {
                id: 1,
                name: 'Ana Silva',
                avatar: 'A',
                photo: 'attached_assets/stock_images/professional_woman_t_a7ca3e5c.jpg',
                bio: 'Desenvolvedora Full Stack com 8 anos de experiência. Especialista em React, Node.js e bancos de dados.',
                expertise: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
                rating: 4.9,
                sessions: 127,
                availability: ['09:00', '10:00', '14:00', '15:00', '16:00']
            },
            {
                id: 2,
                name: 'Carlos Oliveira',
                avatar: 'C',
                photo: 'attached_assets/stock_images/professional_man_tea_68e59bcd.jpg',
                bio: 'Designer UX/UI com foco em experiência do usuário. Mentor em design thinking e prototipação.',
                expertise: ['UX Design', 'UI Design', 'Figma', 'Design Thinking'],
                rating: 4.8,
                sessions: 89,
                availability: ['09:00', '11:00', '14:00', '15:00']
            },
            {
                id: 3,
                name: 'Marina Santos',
                avatar: 'M',
                photo: 'attached_assets/stock_images/professional_woman_t_7333896d.jpg',
                bio: 'Cientista de dados especialista em Machine Learning e análise estatística avançada.',
                expertise: ['Python', 'Machine Learning', 'Data Science', 'Statistics'],
                rating: 5.0,
                sessions: 156,
                availability: ['10:00', '11:00', '14:00', '16:00']
            },
            {
                id: 4,
                name: 'Roberto Lima',
                avatar: 'R',
                photo: 'attached_assets/stock_images/professional_man_tea_30d6bdb5.jpg',
                bio: 'Engenheiro de software sênior com expertise em arquitetura de sistemas e cloud computing.',
                expertise: ['AWS', 'Microservices', 'Docker', 'Kubernetes'],
                rating: 4.7,
                sessions: 203,
                availability: ['09:00', '10:00', '15:00', '16:00']
            },
            {
                id: 5,
                name: 'Fernanda Costa',
                avatar: 'F',
                photo: 'attached_assets/stock_images/professional_woman_t_ad5c331d.jpg',
                bio: 'Product Manager com experiência em metodologias ágeis e gestão de produtos digitais.',
                expertise: ['Product Management', 'Scrum', 'Agile', 'Analytics'],
                rating: 4.9,
                sessions: 78,
                availability: ['09:00', '11:00', '14:00', '15:00']
            },
            {
                id: 6,
                name: 'João Pereira',
                avatar: 'J',
                photo: 'attached_assets/stock_images/professional_man_tea_d10dd5f9.jpg',
                bio: 'Desenvolvedor mobile especializado em React Native e desenvolvimento de aplicativos nativos.',
                expertise: ['React Native', 'iOS', 'Android', 'Flutter'],
                rating: 4.6,
                sessions: 94,
                availability: ['10:00', '11:00', '15:00', '16:00']
            }
        ];
    }
    
    // Materiais padrão
    getDefaultMaterials() {
        return [
            {
                id: 1,
                name: 'Guia Completo de Empreendedorismo Digital',
                description: 'Manual abrangente sobre como iniciar um negócio digital do zero, incluindo estratégias de marketing e monetização.',
                fileName: 'empreendedorismo-digital-2024.pdf',
                fileSize: 2547832, // ~2.5MB
                uploaderId: 1,
                uploaderName: 'Ana Silva',
                uploadDate: '2024-03-15T10:30:00.000Z'
            },
            {
                id: 2,
                name: 'Fundamentos de UX/UI Design',
                description: 'E-book completo sobre princípios de design de experiência do usuário e interface, com exemplos práticos e exercícios.',
                fileName: 'fundamentos-uxui-design.pdf',
                fileSize: 4234567, // ~4.2MB
                uploaderId: 2,
                uploaderName: 'Carlos Oliveira',
                uploadDate: '2024-03-12T14:45:00.000Z'
            },
            {
                id: 3,
                name: 'Introdução à Ciência de Dados com Python',
                description: 'Material didático sobre análise de dados, estatística aplicada e machine learning usando Python e suas principais bibliotecas.',
                fileName: 'ciencia-dados-python.pdf',
                fileSize: 5678901, // ~5.7MB
                uploaderId: 3,
                uploaderName: 'Marina Santos',
                uploadDate: '2024-03-10T09:15:00.000Z'
            },
            {
                id: 4,
                name: 'Arquitetura de Software Moderna',
                description: 'Guia prático sobre padrões de arquitetura, microserviços e práticas de desenvolvimento escalável para aplicações modernas.',
                fileName: 'arquitetura-software-moderna.pdf',
                fileSize: 3456789, // ~3.5MB
                uploaderId: 4,
                uploaderName: 'Roberto Lima',
                uploadDate: '2024-03-08T16:20:00.000Z'
            },
            {
                id: 5,
                name: 'Metodologias Ágeis na Prática',
                description: 'Manual completo sobre Scrum, Kanban e outras metodologias ágeis, com estudos de caso e templates para implementação.',
                fileName: 'metodologias-ageis-pratica.pdf',
                fileSize: 2876543, // ~2.9MB
                uploaderId: 5,
                uploaderName: 'Fernanda Costa',
                uploadDate: '2024-03-05T11:30:00.000Z'
            },
            {
                id: 6,
                name: 'Desenvolvimento Mobile Cross-Platform',
                description: 'Guia comparativo entre React Native, Flutter e desenvolvimento nativo, com exemplos de código e melhores práticas.',
                fileName: 'desenvolvimento-mobile-crossplatform.pdf',
                fileSize: 4567890, // ~4.6MB
                uploaderId: 6,
                uploaderName: 'João Pereira',
                uploadDate: '2024-03-03T13:45:00.000Z'
            },
            {
                id: 7,
                name: 'Marketing Digital para Startups',
                description: 'Estratégias de marketing digital de baixo custo para startups, incluindo SEO, redes sociais e growth hacking.',
                fileName: 'marketing-digital-startups.pdf',
                fileSize: 3234567, // ~3.2MB
                uploaderId: 1,
                uploaderName: 'Ana Silva',
                uploadDate: '2024-02-28T15:00:00.000Z'
            },
            {
                id: 8,
                name: 'Gestão Financeira para Desenvolvedores',
                description: 'Guia prático sobre finanças pessoais e empresariais para profissionais de tecnologia freelancers e empreendedores.',
                fileName: 'gestao-financeira-devs.pdf',
                fileSize: 2123456, // ~2.1MB
                uploaderId: 5,
                uploaderName: 'Fernanda Costa',
                uploadDate: '2024-02-25T08:30:00.000Z'
            }
        ];
    }
    
    // Grupos padrão
    getDefaultGroups() {
        return [
            {
                id: 1,
                name: 'Empreendedorismo Digital',
                description: 'Grupo focado em discussões sobre negócios digitais, startups, marketing online e monetização de projetos.',
                createdBy: 1,
                creatorName: 'Ana Silva',
                members: [1, 2, 4],
                createdAt: '2024-03-10T10:00:00.000Z'
            },
            {
                id: 2,
                name: 'Desenvolvimento Web Full Stack',
                description: 'Comunidade para desenvolvedores que trabalham com frontend e backend, compartilhando conhecimentos e projetos.',
                createdBy: 1,
                creatorName: 'Ana Silva',
                members: [1, 4, 6],
                createdAt: '2024-03-08T14:30:00.000Z'
            },
            {
                id: 3,
                name: 'UX/UI Design Colaborativo',
                description: 'Espaço para designers compartilharem projetos, receberem feedback e discutirem tendências de design.',
                createdBy: 2,
                creatorName: 'Carlos Oliveira',
                members: [2, 5],
                createdAt: '2024-03-05T16:45:00.000Z'
            },
            {
                id: 4,
                name: 'Ciência de Dados e IA',
                description: 'Grupo para profissionais e estudantes interessados em data science, machine learning e inteligência artificial.',
                createdBy: 3,
                creatorName: 'Marina Santos',
                members: [3, 1, 4],
                createdAt: '2024-03-02T09:20:00.000Z'
            },
            {
                id: 5,
                name: 'Metodologias Ágeis',
                description: 'Discussões sobre Scrum, Kanban, SAFe e outras metodologias ágeis aplicadas a projetos de tecnologia.',
                createdBy: 5,
                creatorName: 'Fernanda Costa',
                members: [5, 1, 2, 4],
                createdAt: '2024-02-28T11:15:00.000Z'
            },
            {
                id: 6,
                name: 'Desenvolvimento Mobile',
                description: 'Comunidade para desenvolvedores mobile compartilharem conhecimentos sobre iOS, Android e desenvolvimento híbrido.',
                createdBy: 6,
                creatorName: 'João Pereira',
                members: [6, 1, 4],
                createdAt: '2024-02-25T13:00:00.000Z'
            },
            {
                id: 7,
                name: 'Arquitetura de Software',
                description: 'Grupo avançado para discussão de padrões arquiteturais, microserviços, cloud computing e escalabilidade.',
                createdBy: 4,
                creatorName: 'Roberto Lima',
                members: [4, 1, 3, 6],
                createdAt: '2024-02-20T15:30:00.000Z'
            },
            {
                id: 8,
                name: 'Carreira em Tech',
                description: 'Orientações sobre carreira, networking, transição de carreira e desenvolvimento profissional na área de tecnologia.',
                createdBy: 5,
                creatorName: 'Fernanda Costa',
                members: [5, 1, 2, 3, 4, 6],
                createdAt: '2024-02-18T12:45:00.000Z'
            }
        ];
    }
}

// Inicializar aplicação
const app = new EduConnect();