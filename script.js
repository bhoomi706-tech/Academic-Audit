/**
 * College Academic Audit & Dashboard System
 * Vanilla JS Implementation
 */

// --- Constants ---
const STORAGE_KEYS = {
    USER: 'cad_user',
    MEETINGS: 'cad_meetings',
    SYLLABUS: 'cad_syllabus',
    ATTENDANCE: 'cad_attendance',
    AUDIT: 'cad_audit',
    COMMENTS: 'cad_comments',
    NOTIFICATIONS: 'cad_notifications',
    SCHEDULE: 'cad_schedule'
};

const DEPARTMENTS = ['CS-A', 'CS-B', 'CS-C', 'CSE', 'ECS', 'MECH'];

const AUDIT_MODULES = [
    'DQAC Module', 'Program Exit Survey', 'CO-PO Module', 'Project Evaluation',
    'Guest Lecture & Industrial Visits', 'Weak & Bright Students', 'GAP in Curriculum',
    'Mini Project & VAP', 'Internship', 'Placement', 'MoU', 'Budget',
    'Faculty Publications', 'Research & Consultancy', 'Lab Maintenance',
    'Admission Details', 'Student Achievements', 'SDG Initiatives', 'Vision & Mission'
];

// --- Utility Functions ---
const getStorage = (key, defaultVal = []) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
};

const setStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
    // Trigger notification check on save
    checkSystemNotifications();
};

const getCurrentUser = () => getStorage(STORAGE_KEYS.USER, null);

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// --- Auth & Navigation ---
const checkAuth = () => {
    const user = getCurrentUser();
    const path = window.location.pathname;
    const isLoginPage = path.endsWith('index.html') || path === '/' || path.endsWith('/');

    if (!user && !isLoginPage) {
        window.location.href = 'index.html';
    } else if (user && isLoginPage) {
        window.location.href = 'dashboard.html';
    }
    return user;
};

const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    window.location.href = 'index.html';
};

const renderSidebar = (activePage) => {
    const user = getCurrentUser();
    if (!user) return;

    const sidebarHtml = `
        <div class="sidebar-header">
            <h3>Academic Audit</h3>
            <div class="small text-muted mt-1">${user.name} (${user.role})</div>
            <div class="small text-muted">${user.department}</div>
        </div>
        <ul class="components">
            <li class="${activePage === 'dashboard' ? 'active' : ''}">
                <a href="dashboard.html"><i class="bi bi-speedometer2"></i> Dashboard</a>
            </li>
            <li class="${activePage === 'meetings' ? 'active' : ''}">
                <a href="meetings.html"><i class="bi bi-calendar-event"></i> Meetings</a>
            </li>
            <li class="${activePage === 'syllabus' ? 'active' : ''}">
                <a href="syllabus.html"><i class="bi bi-book"></i> Syllabus</a>
            </li>
            <li class="${activePage === 'attendance' ? 'active' : ''}">
                <a href="attendance.html"><i class="bi bi-people"></i> Attendance</a>
            </li>
            <li class="${activePage === 'analysis' ? 'active' : ''}">
                <a href="analysis.html"><i class="bi bi-graph-up"></i> Analysis</a>
            </li>
            <li class="${activePage === 'audit' ? 'active' : ''}">
                <a href="audit.html"><i class="bi bi-clipboard-check"></i> Academic Audit</a>
            </li>
            <li class="${activePage === 'scheduler' ? 'active' : ''}">
                <a href="scheduler.html"><i class="bi bi-clock"></i> Scheduler</a>
            </li>
            <li class="mt-4">
                <a href="#" onclick="logout()"><i class="bi bi-box-arrow-right"></i> Logout</a>
            </li>
        </ul>
    `;
    
    const sidebarEl = document.getElementById('sidebar');
    if (sidebarEl) sidebarEl.innerHTML = sidebarHtml;

    // Mobile toggle
    document.getElementById('sidebarCollapse')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
};

// --- Notifications ---
const updateNotificationBadge = () => {
    const notifications = getStorage(STORAGE_KEYS.NOTIFICATIONS, []);
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notification-badge');
    if (badge) {
        badge.innerText = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
};

const showNotifications = () => {
    const notifications = getStorage(STORAGE_KEYS.NOTIFICATIONS, []);
    const list = notifications.map(n => `
        <li class="list-group-item ${n.read ? '' : 'bg-light'}">
            <div class="d-flex justify-content-between">
                <small class="text-muted">${formatDate(n.date)}</small>
                ${!n.read ? '<span class="badge bg-primary rounded-pill">New</span>' : ''}
            </div>
            <div class="mt-1">${n.message}</div>
        </li>
    `).join('') || '<li class="list-group-item text-center text-muted">No notifications</li>';
    
    const modalBody = document.getElementById('notificationModalBody');
    if (modalBody) {
        modalBody.innerHTML = `<ul class="list-group list-group-flush">${list}</ul>`;
        
        // Mark all as read
        const updated = notifications.map(n => ({...n, read: true}));
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
        updateNotificationBadge();
        
        const modal = new bootstrap.Modal(document.getElementById('notificationModal'));
        modal.show();
    }
};

const checkSystemNotifications = () => {
    const user = getCurrentUser();
    if (!user) return;

    let notifications = getStorage(STORAGE_KEYS.NOTIFICATIONS, []);
    const syllabus = getStorage(STORAGE_KEYS.SYLLABUS, []).filter(s => s.department === user.department);
    const attendance = getStorage(STORAGE_KEYS.ATTENDANCE, []).filter(a => a.department === user.department);
    const meetings = getStorage(STORAGE_KEYS.MEETINGS, []).filter(m => m.department === user.department);
    const schedule = getStorage(STORAGE_KEYS.SCHEDULE, []).filter(s => s.department === user.department);
    
    const addNotif = (msg) => {
        const today = new Date().toISOString().split('T')[0];
        // Avoid duplicate messages for the same day
        if (!notifications.some(n => n.message === msg && n.date.startsWith(today))) {
            notifications.unshift({
                id: generateId(),
                message: msg,
                date: new Date().toISOString(),
                read: false
            });
        }
    };

    // Syllabus Check
    syllabus.forEach(s => {
        const pct = s.total ? (s.completed / s.total) * 100 : 0;
        if (pct < 40) addNotif(`Critical: Syllabus for ${s.subject} is below 40% (${Math.round(pct)}%)`);
    });

    // Attendance Check
    attendance.forEach(a => {
        const pct = a.total ? (a.taken / a.total) * 100 : 0;
        if (pct < 75) addNotif(`Warning: Attendance for ${a.subject} is below 75% (${Math.round(pct)}%)`);
    });

    // Scheduler Check (Upcoming meetings)
    const todayStr = new Date().toISOString().split('T')[0];
    schedule.forEach(s => {
        if (s.date === todayStr) {
            addNotif(`Reminder: Scheduled meeting "${s.title}" is today at ${s.time}`);
        }
    });

    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    updateNotificationBadge();
};

// --- Page Initialization ---

// 1. Login
const initLogin = () => {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const role = document.getElementById('role').value;
        const department = document.getElementById('department').value;
        
        const user = {
            name: email.split('@')[0],
            email,
            role,
            department
        };
        
        setStorage(STORAGE_KEYS.USER, user);
        window.location.href = 'dashboard.html';
    });
};

// 2. Dashboard
const initDashboard = () => {
    const user = getCurrentUser();
    const meetings = getStorage(STORAGE_KEYS.MEETINGS, []).filter(m => m.department === user.department);
    const syllabus = getStorage(STORAGE_KEYS.SYLLABUS, []).filter(s => s.department === user.department);
    const attendance = getStorage(STORAGE_KEYS.ATTENDANCE, []).filter(a => a.department === user.department);

    // Stats
    const totalMeetings = meetings.length;
    
    let syllabusPct = 0;
    if (syllabus.length > 0) {
        const total = syllabus.reduce((acc, curr) => acc + Number(curr.total), 0);
        const comp = syllabus.reduce((acc, curr) => acc + Number(curr.completed), 0);
        syllabusPct = total ? Math.round((comp / total) * 100) : 0;
    }

    let attendancePct = 0;
    if (attendance.length > 0) {
        const total = attendance.reduce((acc, curr) => acc + Number(curr.total), 0);
        const taken = attendance.reduce((acc, curr) => acc + Number(curr.taken), 0);
        attendancePct = total ? Math.round((taken / total) * 100) : 0;
    }

    const meetingScore = Math.min(totalMeetings * 20, 100);
    const overall = Math.round((syllabusPct + attendancePct + meetingScore) / 3);

    document.getElementById('totalMeetings').innerText = totalMeetings;
    document.getElementById('syllabusPct').innerText = syllabusPct + '%';
    document.getElementById('attendancePct').innerText = attendancePct + '%';
    document.getElementById('overallPct').innerText = overall + '%';

    // Charts
    new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: ['Syllabus', 'Attendance', 'Meetings'],
            datasets: [{
                label: 'Completion %',
                data: [syllabusPct, attendancePct, meetingScore],
                backgroundColor: ['#0d6efd', '#198754', '#ffc107'],
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });

    new Chart(document.getElementById('radarChart'), {
        type: 'radar',
        data: {
            labels: ['Syllabus', 'Attendance', 'Meetings', 'Audit', 'Research'],
            datasets: [{
                label: 'Performance',
                data: [syllabusPct, attendancePct, meetingScore, 75, 60], // Dummy data for Audit/Research for now
                backgroundColor: 'rgba(13, 110, 253, 0.2)',
                borderColor: '#0d6efd',
                pointBackgroundColor: '#0d6efd'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { r: { min: 0, max: 100 } }
        }
    });
};

// 3. Meetings
const initMeetings = () => {
    const user = getCurrentUser();
    let meetings = getStorage(STORAGE_KEYS.MEETINGS, []);
    const tableBody = document.getElementById('meetingsTableBody');
    const form = document.getElementById('meetingForm');
    const modal = new bootstrap.Modal(document.getElementById('meetingModal'));

    const render = () => {
        const deptMeetings = meetings.filter(m => m.department === user.department);
        tableBody.innerHTML = deptMeetings.map(m => `
            <tr>
                <td>${m.title}</td>
                <td>${formatDate(m.date)}</td>
                <td><span class="badge bg-${m.conducted ? 'success' : 'secondary'}">${m.conducted ? 'Yes' : 'No'}</span></td>
                <td><span class="badge bg-${m.attended ? 'success' : 'danger'}">${m.attended ? 'Yes' : 'No'}</span></td>
                <td>${m.remarks || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editMeeting('${m.id}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMeeting('${m.id}')"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
    };

    window.editMeeting = (id) => {
        const m = meetings.find(x => x.id === id);
        if (!m) return;
        document.getElementById('mId').value = m.id;
        document.getElementById('mTitle').value = m.title;
        document.getElementById('mDate').value = m.date;
        document.getElementById('mConducted').checked = m.conducted;
        document.getElementById('mAttended').checked = m.attended;
        document.getElementById('mRemarks').value = m.remarks || '';
        document.getElementById('meetingModalTitle').innerText = 'Edit Meeting';
        modal.show();
    };

    window.deleteMeeting = (id) => {
        if (confirm('Delete this meeting?')) {
            meetings = meetings.filter(m => m.id !== id);
            setStorage(STORAGE_KEYS.MEETINGS, meetings);
            render();
        }
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('mId').value;
        const data = {
            id: id || generateId(),
            department: user.department,
            title: document.getElementById('mTitle').value,
            date: document.getElementById('mDate').value,
            conducted: document.getElementById('mConducted').checked,
            attended: document.getElementById('mAttended').checked,
            remarks: document.getElementById('mRemarks').value
        };

        if (id) {
            const idx = meetings.findIndex(x => x.id === id);
            if (idx !== -1) meetings[idx] = data;
        } else {
            meetings.push(data);
            // Add notification for new meeting
            const notifs = getStorage(STORAGE_KEYS.NOTIFICATIONS, []);
            notifs.unshift({
                id: generateId(),
                message: `New meeting added: ${data.title}`,
                date: new Date().toISOString(),
                read: false
            });
            setStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
        }

        setStorage(STORAGE_KEYS.MEETINGS, meetings);
        modal.hide();
        form.reset();
        document.getElementById('mId').value = '';
        document.getElementById('meetingModalTitle').innerText = 'Add Meeting';
        render();
    });

    document.getElementById('meetingModal').addEventListener('hidden.bs.modal', () => {
        form.reset();
        document.getElementById('mId').value = '';
        document.getElementById('meetingModalTitle').innerText = 'Add Meeting';
    });

    render();
};

// 4. Syllabus
const initSyllabus = () => {
    const user = getCurrentUser();
    let syllabus = getStorage(STORAGE_KEYS.SYLLABUS, []);
    const listContainer = document.getElementById('syllabusList');
    const form = document.getElementById('syllabusForm');
    const modal = new bootstrap.Modal(document.getElementById('syllabusModal'));

    const render = () => {
        const deptSyllabus = syllabus.filter(s => s.department === user.department);
        listContainer.innerHTML = deptSyllabus.map(s => {
            const pct = s.total ? Math.round((s.completed / s.total) * 100) : 0;
            return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="card-title mb-0">${s.subject}</h5>
                        <div>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="editSyllabus('${s.id}')"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteSyllabus('${s.id}')"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                    <div class="row align-items-center">
                        <div class="col-md-4 text-muted small">
                            Units: ${s.completed} / ${s.total}
                        </div>
                        <div class="col-md-8">
                            <div class="progress" style="height: 10px;">
                                <div class="progress-bar bg-${pct < 40 ? 'danger' : (pct < 70 ? 'warning' : 'success')}" 
                                     role="progressbar" style="width: ${pct}%"></div>
                            </div>
                            <div class="text-end small mt-1">${pct}% Completed</div>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    };

    window.editSyllabus = (id) => {
        const s = syllabus.find(x => x.id === id);
        if (!s) return;
        document.getElementById('sId').value = s.id;
        document.getElementById('sSubject').value = s.subject;
        document.getElementById('sTotal').value = s.total;
        document.getElementById('sCompleted').value = s.completed;
        document.getElementById('syllabusModalTitle').innerText = 'Edit Subject';
        modal.show();
    };

    window.deleteSyllabus = (id) => {
        if (confirm('Delete this subject?')) {
            syllabus = syllabus.filter(s => s.id !== id);
            setStorage(STORAGE_KEYS.SYLLABUS, syllabus);
            render();
        }
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('sId').value;
        const data = {
            id: id || generateId(),
            department: user.department,
            subject: document.getElementById('sSubject').value,
            total: Number(document.getElementById('sTotal').value),
            completed: Number(document.getElementById('sCompleted').value)
        };

        if (id) {
            const idx = syllabus.findIndex(x => x.id === id);
            if (idx !== -1) syllabus[idx] = data;
        } else {
            syllabus.push(data);
        }

        setStorage(STORAGE_KEYS.SYLLABUS, syllabus);
        modal.hide();
        form.reset();
        document.getElementById('sId').value = '';
        render();
    });

    document.getElementById('syllabusModal').addEventListener('hidden.bs.modal', () => {
        form.reset();
        document.getElementById('sId').value = '';
        document.getElementById('syllabusModalTitle').innerText = 'Add Subject';
    });

    render();
};

// 5. Attendance
const initAttendance = () => {
    const user = getCurrentUser();
    let attendance = getStorage(STORAGE_KEYS.ATTENDANCE, []);
    const tableBody = document.getElementById('attendanceTableBody');
    const form = document.getElementById('attendanceForm');
    const modal = new bootstrap.Modal(document.getElementById('attendanceModal'));

    const render = () => {
        const deptAttendance = attendance.filter(a => a.department === user.department);
        tableBody.innerHTML = deptAttendance.map(a => {
            const pct = a.total ? Math.round((a.taken / a.total) * 100) : 0;
            return `
            <tr>
                <td>${a.subject}</td>
                <td>${a.total}</td>
                <td>${a.taken}</td>
                <td>
                    <span class="badge bg-${pct < 75 ? 'danger' : 'success'}">${pct}%</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editAttendance('${a.id}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteAttendance('${a.id}')"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    };

    window.editAttendance = (id) => {
        const a = attendance.find(x => x.id === id);
        if (!a) return;
        document.getElementById('aId').value = a.id;
        document.getElementById('aSubject').value = a.subject;
        document.getElementById('aTotal').value = a.total;
        document.getElementById('aTaken').value = a.taken;
        document.getElementById('attendanceModalTitle').innerText = 'Edit Attendance';
        modal.show();
    };

    window.deleteAttendance = (id) => {
        if (confirm('Delete?')) {
            attendance = attendance.filter(a => a.id !== id);
            setStorage(STORAGE_KEYS.ATTENDANCE, attendance);
            render();
        }
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('aId').value;
        const data = {
            id: id || generateId(),
            department: user.department,
            subject: document.getElementById('aSubject').value,
            total: Number(document.getElementById('aTotal').value),
            taken: Number(document.getElementById('aTaken').value)
        };

        if (id) {
            const idx = attendance.findIndex(x => x.id === id);
            if (idx !== -1) attendance[idx] = data;
        } else {
            attendance.push(data);
        }

        setStorage(STORAGE_KEYS.ATTENDANCE, attendance);
        modal.hide();
        form.reset();
        document.getElementById('aId').value = '';
        render();
    });

    document.getElementById('attendanceModal').addEventListener('hidden.bs.modal', () => {
        form.reset();
        document.getElementById('aId').value = '';
        document.getElementById('attendanceModalTitle').innerText = 'Add Attendance';
    });

    render();
};

// 6. Analysis
const initAnalysis = () => {
    const user = getCurrentUser();
    const meetings = getStorage(STORAGE_KEYS.MEETINGS, []).filter(m => m.department === user.department);
    const syllabus = getStorage(STORAGE_KEYS.SYLLABUS, []).filter(s => s.department === user.department);
    const attendance = getStorage(STORAGE_KEYS.ATTENDANCE, []).filter(a => a.department === user.department);
    let comments = getStorage(STORAGE_KEYS.COMMENTS, []);

    // Stats
    const totalMeetings = meetings.length;
    const meetingScore = Math.min(totalMeetings * 20, 100);

    let syllabusPct = 0;
    if (syllabus.length > 0) {
        const total = syllabus.reduce((acc, curr) => acc + Number(curr.total), 0);
        const comp = syllabus.reduce((acc, curr) => acc + Number(curr.completed), 0);
        syllabusPct = total ? Math.round((comp / total) * 100) : 0;
    }

    let attendancePct = 0;
    if (attendance.length > 0) {
        const total = attendance.reduce((acc, curr) => acc + Number(curr.total), 0);
        const taken = attendance.reduce((acc, curr) => acc + Number(curr.taken), 0);
        attendancePct = total ? Math.round((taken / total) * 100) : 0;
    }

    const overall = Math.round((syllabusPct + attendancePct + meetingScore) / 3);

    document.getElementById('anMeeting').innerText = meetingScore + '%';
    document.getElementById('anSyllabus').innerText = syllabusPct + '%';
    document.getElementById('anAttendance').innerText = attendancePct + '%';
    
    const perfEl = document.getElementById('overallPerformance');
    perfEl.innerText = overall + '%';
    perfEl.className = `performance-indicator ${overall < 40 ? 'bg-performance-red' : (overall < 60 ? 'bg-performance-orange' : 'bg-performance-green')}`;

    // Charts
    new Chart(document.getElementById('analysisRadarChart'), {
        type: 'radar',
        data: {
            labels: ['Meetings', 'Syllabus', 'Attendance'],
            datasets: [{
                label: 'Performance',
                data: [meetingScore, syllabusPct, attendancePct],
                backgroundColor: 'rgba(13, 110, 253, 0.2)',
                borderColor: '#0d6efd',
                pointBackgroundColor: '#0d6efd'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { r: { min: 0, max: 100 } }
        }
    });

    new Chart(document.getElementById('analysisDonutChart'), {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                data: [overall, 100 - overall],
                backgroundColor: [overall < 40 ? '#dc3545' : (overall < 60 ? '#fd7e14' : '#198754'), '#e9ecef']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Comments
    const commentList = document.getElementById('commentList');
    const commentForm = document.getElementById('commentForm');

    const renderComments = () => {
        commentList.innerHTML = comments.map(c => `
            <div class="comment-box position-relative">
                <div class="comment-meta">
                    <strong>${c.role} (${c.department})</strong>
                    <span>${formatDate(c.date)}</span>
                </div>
                <div>${c.text}</div>
                ${user.role === 'Admin' ? `<button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2" onclick="deleteComment('${c.id}')">&times;</button>` : ''}
            </div>
        `).join('');
    };

    window.deleteComment = (id) => {
        if (confirm('Delete comment?')) {
            comments = comments.filter(c => c.id !== id);
            setStorage(STORAGE_KEYS.COMMENTS, comments);
            renderComments();
        }
    };

    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = document.getElementById('commentText').value;
        comments.unshift({
            id: generateId(),
            text,
            date: new Date().toISOString(),
            department: user.department,
            role: user.role
        });
        setStorage(STORAGE_KEYS.COMMENTS, comments);
        document.getElementById('commentText').value = '';
        renderComments();
    });

    renderComments();
};

// 7. Audit
const initAudit = () => {
    const user = getCurrentUser();
    let auditData = getStorage(STORAGE_KEYS.AUDIT, {});
    
    if (!auditData[user.department]) {
        auditData[user.department] = {};
    }

    const moduleListEl = document.getElementById('auditModuleList');
    const formContainerEl = document.getElementById('auditFormContainer');
    const titleEl = document.getElementById('selectedModuleTitle');
    const commentsSectionEl = document.getElementById('auditCommentsSection');
    const commentsListEl = document.getElementById('moduleCommentsList');
    const commentFormEl = document.getElementById('moduleCommentForm');
    const statusBadgeEl = document.getElementById('moduleStatus');

    let currentModule = null;

    const getModuleData = (moduleName) => {
        const deptData = auditData[user.department];
        let moduleData = deptData[moduleName];
        
        // Ensure data structure
        if (!moduleData || typeof moduleData !== 'object') {
            moduleData = {
                fields: {},
                files: {},
                comments: [],
                lastUpdated: null
            };
            deptData[moduleName] = moduleData;
            setStorage(STORAGE_KEYS.AUDIT, auditData);
        }
        return moduleData;
    };

    const renderSidebarList = () => {
        moduleListEl.innerHTML = AUDIT_MODULES.map(section => {
            const data = getModuleData(section);
            const isCompleted = data.lastUpdated !== null;
            const activeClass = currentModule === section ? 'active' : '';
            const statusIcon = isCompleted ? '<i class="bi bi-check-circle-fill text-success ms-2"></i>' : '';
            
            return `
                <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${activeClass}" 
                        onclick="loadAuditModule('${section}')">
                    ${section}
                    ${statusIcon}
                </button>
            `;
        }).join('');
    };

    window.loadAuditModule = (moduleName) => {
        currentModule = moduleName;
        renderSidebarList();
        
        const data = getModuleData(moduleName);
        const fields = data.fields || {};
        const files = data.files || {};
        
        titleEl.innerText = moduleName;
        statusBadgeEl.innerText = data.lastUpdated ? 'Updated' : 'Pending';
        statusBadgeEl.className = `badge ${data.lastUpdated ? 'bg-success' : 'bg-secondary'}`;

        let formHtml = '';

        // Generate specific form based on module name
        switch(moduleName) {
            case 'DQAC Module':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Last Meeting Date</label>
                            <input type="date" class="form-control" name="lastMeetingDate" value="${fields.lastMeetingDate || ''}">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">MoM Upload</label>
                            <input type="file" class="form-control" onchange="handleFileUpload(this, 'momFile')">
                            <small class="text-muted d-block mt-1">Current: ${files.momFile || 'None'}</small>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Action Taken Report Upload</label>
                            <input type="file" class="form-control" onchange="handleFileUpload(this, 'atrFile')">
                            <small class="text-muted d-block mt-1">Current: ${files.atrFile || 'None'}</small>
                        </div>
                    </div>`;
                break;

            case 'Program Exit Survey':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Total Graduated Students</label>
                            <input type="number" class="form-control" name="totalGraduated" id="totalGraduated" value="${fields.totalGraduated || ''}" oninput="calcExitSurvey()">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Students Given Feedback</label>
                            <input type="number" class="form-control" name="studentsFeedback" id="studentsFeedback" value="${fields.studentsFeedback || ''}" oninput="calcExitSurvey()">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Feedback %</label>
                            <input type="text" class="form-control bg-light" name="feedbackPct" id="feedbackPct" value="${fields.feedbackPct || ''}" readonly>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Upload Survey Report</label>
                            <input type="file" class="form-control" onchange="handleFileUpload(this, 'surveyReport')">
                            <small class="text-muted d-block mt-1">Current: ${files.surveyReport || 'None'}</small>
                        </div>
                    </div>`;
                break;

            case 'CO-PO Module':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">No of Courses</label>
                            <input type="number" class="form-control" name="noCourses" value="${fields.noCourses || ''}">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">No of CO</label>
                            <input type="number" class="form-control" name="noCO" value="${fields.noCO || ''}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Direct Attainment %</label>
                            <input type="number" class="form-control" name="directAtt" id="directAtt" value="${fields.directAtt || ''}" oninput="calcCOPO()">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Indirect Attainment %</label>
                            <input type="number" class="form-control" name="indirectAtt" id="indirectAtt" value="${fields.indirectAtt || ''}" oninput="calcCOPO()">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Final Attainment %</label>
                            <input type="text" class="form-control bg-light" name="finalAtt" id="finalAtt" value="${fields.finalAtt || ''}" readonly>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Upload CO-PO Mapping File</label>
                            <input type="file" class="form-control" onchange="handleFileUpload(this, 'copoFile')">
                            <small class="text-muted d-block mt-1">Current: ${files.copoFile || 'None'}</small>
                        </div>
                    </div>`;
                break;

            case 'Project Evaluation':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Total Projects</label>
                            <input type="number" class="form-control" name="totalProjects" value="${fields.totalProjects || ''}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Industry Sponsored</label>
                            <input type="number" class="form-control" name="industryProjects" value="${fields.industryProjects || ''}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Internal Projects</label>
                            <input type="number" class="form-control" name="internalProjects" value="${fields.internalProjects || ''}">
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Upload Evaluation Report</label>
                            <input type="file" class="form-control" onchange="handleFileUpload(this, 'evalReport')">
                            <small class="text-muted d-block mt-1">Current: ${files.evalReport || 'None'}</small>
                        </div>
                    </div>`;
                break;

            case 'Guest Lecture & Industrial Visits':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">No of Guest Lectures</label>
                            <input type="number" class="form-control" name="guestLectures" value="${fields.guestLectures || ''}">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">No of Industrial Visits</label>
                            <input type="number" class="form-control" name="industrialVisits" value="${fields.industrialVisits || ''}">
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Upload Supporting Documents</label>
                            <input type="file" class="form-control" onchange="handleFileUpload(this, 'supportDocs')">
                            <small class="text-muted d-block mt-1">Current: ${files.supportDocs || 'None'}</small>
                        </div>
                    </div>`;
                break;

            case 'Weak & Bright Students':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-12">
                            <label class="form-label">No of Weak Students</label>
                            <input type="number" class="form-control" name="weakStudents" value="${fields.weakStudents || ''}">
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Remedial Actions Taken</label>
                            <textarea class="form-control" name="remedialActions" rows="3">${fields.remedialActions || ''}</textarea>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">No of Bright Students</label>
                            <input type="number" class="form-control" name="brightStudents" value="${fields.brightStudents || ''}">
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Enhancement Activities</label>
                            <textarea class="form-control" name="enhancementActivities" rows="3">${fields.enhancementActivities || ''}</textarea>
                        </div>
                    </div>`;
                break;

            case 'GAP in Curriculum':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-12">
                            <label class="form-label">Identified Gaps</label>
                            <textarea class="form-control" name="identifiedGaps" rows="4">${fields.identifiedGaps || ''}</textarea>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Actions Taken</label>
                            <textarea class="form-control" name="gapActions" rows="4">${fields.gapActions || ''}</textarea>
                        </div>
                    </div>`;
                break;

            case 'Mini Project & VAP':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">No of Mini Projects</label>
                            <input type="number" class="form-control" name="miniProjects" value="${fields.miniProjects || ''}">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Value Added Programs Conducted</label>
                            <input type="number" class="form-control" name="vapConducted" value="${fields.vapConducted || ''}">
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Upload Report</label>
                            <input type="file" class="form-control" onchange="handleFileUpload(this, 'miniProjectReport')">
                            <small class="text-muted d-block mt-1">Current: ${files.miniProjectReport || 'None'}</small>
                        </div>
                    </div>`;
                break;

            case 'Internship':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Students Completed Internship</label>
                            <input type="number" class="form-control" name="internshipStudents" value="${fields.internshipStudents || ''}">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Industry Partners</label>
                            <input type="text" class="form-control" name="industryPartners" value="${fields.industryPartners || ''}">
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Upload Internship Report</label>
                            <input type="file" class="form-control" onchange="handleFileUpload(this, 'internshipReport')">
                            <small class="text-muted d-block mt-1">Current: ${files.internshipReport || 'None'}</small>
                        </div>
                    </div>`;
                break;

            case 'Placement':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Total Students (Final Year)</label>
                            <input type="number" class="form-control" name="totalFinalYear" id="totalFinalYear" value="${fields.totalFinalYear || ''}" oninput="calcPlacement()">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Students Placed</label>
                            <input type="number" class="form-control" name="studentsPlaced" id="studentsPlaced" value="${fields.studentsPlaced || ''}" oninput="calcPlacement()">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Highest Package (LPA)</label>
                            <input type="number" class="form-control" name="highestPackage" value="${fields.highestPackage || ''}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Average Package (LPA)</label>
                            <input type="number" class="form-control" name="avgPackage" value="${fields.avgPackage || ''}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Placement %</label>
                            <input type="text" class="form-control bg-light" name="placementPct" id="placementPct" value="${fields.placementPct || ''}" readonly>
                        </div>
                    </div>`;
                break;

            case 'Budget Utilization':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Allocated Budget</label>
                            <input type="number" class="form-control" name="allocatedBudget" id="allocatedBudget" value="${fields.allocatedBudget || ''}" oninput="calcBudget()">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Utilized Budget</label>
                            <input type="number" class="form-control" name="utilizedBudget" id="utilizedBudget" value="${fields.utilizedBudget || ''}" oninput="calcBudget()">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Utilization %</label>
                            <input type="text" class="form-control bg-light" name="utilizationPct" id="utilizationPct" value="${fields.utilizationPct || ''}" readonly>
                        </div>
                    </div>`;
                break;

            case 'Faculty Publications':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Papers Published</label>
                            <input type="number" class="form-control" name="papersPublished" value="${fields.papersPublished || ''}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Scopus Indexed</label>
                            <input type="number" class="form-control" name="scopusIndexed" value="${fields.scopusIndexed || ''}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Conferences Attended</label>
                            <input type="number" class="form-control" name="conferencesAttended" value="${fields.conferencesAttended || ''}">
                        </div>
                    </div>`;
                break;

            case 'Research & Consultancy':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Research Projects</label>
                            <input type="number" class="form-control" name="researchProjects" value="${fields.researchProjects || ''}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Consultancy Revenue</label>
                            <input type="number" class="form-control" name="consultancyRevenue" value="${fields.consultancyRevenue || ''}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Grants Received</label>
                            <input type="number" class="form-control" name="grantsReceived" value="${fields.grantsReceived || ''}">
                        </div>
                    </div>`;
                break;

            case 'Lab Maintenance':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Labs Maintained</label>
                            <input type="number" class="form-control" name="labsMaintained" value="${fields.labsMaintained || ''}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Equipment Upgraded</label>
                            <input type="number" class="form-control" name="equipmentUpgraded" value="${fields.equipmentUpgraded || ''}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">AMC Status</label>
                            <select class="form-select" name="amcStatus">
                                <option value="Active" ${fields.amcStatus === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Expired" ${fields.amcStatus === 'Expired' ? 'selected' : ''}>Expired</option>
                                <option value="Not Applicable" ${fields.amcStatus === 'Not Applicable' ? 'selected' : ''}>Not Applicable</option>
                            </select>
                        </div>
                    </div>`;
                break;

            case 'Admission Details':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Total Intake</label>
                            <input type="number" class="form-control" name="totalIntake" id="totalIntake" value="${fields.totalIntake || ''}" oninput="calcAdmission()">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Admissions Filled</label>
                            <input type="number" class="form-control" name="admissionsFilled" id="admissionsFilled" value="${fields.admissionsFilled || ''}" oninput="calcAdmission()">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Admission %</label>
                            <input type="text" class="form-control bg-light" name="admissionPct" id="admissionPct" value="${fields.admissionPct || ''}" readonly>
                        </div>
                    </div>`;
                break;

            case 'Student Achievements':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-12">
                            <label class="form-label">Technical Achievements</label>
                            <textarea class="form-control" name="techAchievements" rows="3">${fields.techAchievements || ''}</textarea>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Non-Technical Achievements</label>
                            <textarea class="form-control" name="nonTechAchievements" rows="3">${fields.nonTechAchievements || ''}</textarea>
                        </div>
                    </div>`;
                break;

            case 'SDG Initiatives':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-12">
                            <label class="form-label">SDG Activities Conducted</label>
                            <textarea class="form-control" name="sdgActivities" rows="3">${fields.sdgActivities || ''}</textarea>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Impact Description</label>
                            <textarea class="form-control" name="sdgImpact" rows="3">${fields.sdgImpact || ''}</textarea>
                        </div>
                    </div>`;
                break;

            case 'Vision & Mission':
                formHtml = `
                    <div class="row g-3">
                        <div class="col-md-12">
                            <label class="form-label">Vision Statement</label>
                            <textarea class="form-control" name="visionStatement" rows="4">${fields.visionStatement || ''}</textarea>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Mission Statement</label>
                            <textarea class="form-control" name="missionStatement" rows="4">${fields.missionStatement || ''}</textarea>
                        </div>
                    </div>`;
                break;

            default:
                formHtml = `<div class="alert alert-info">Select a module to view details.</div>`;
        }

        formContainerEl.innerHTML = `
            <form id="activeAuditForm">
                ${formHtml}
                <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                    <small class="text-muted">Last updated: ${data.lastUpdated ? formatDate(data.lastUpdated) : 'Never'}</small>
                    <button type="submit" class="btn btn-primary"><i class="bi bi-save me-2"></i>Save Changes</button>
                </div>
            </form>
        `;

        // Handle Form Submit
        document.getElementById('activeAuditForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const fieldsData = {};
            
            // Collect all inputs except files (handled separately)
            for (let [key, value] of formData.entries()) {
                fieldsData[key] = value;
            }

            // Merge with existing files
            const currentFiles = auditData[user.department][currentModule].files || {};

            auditData[user.department][currentModule] = {
                fields: fieldsData,
                files: currentFiles,
                comments: data.comments,
                lastUpdated: new Date().toISOString()
            };
            
            setStorage(STORAGE_KEYS.AUDIT, auditData);
            loadAuditModule(currentModule);
            alert('Changes saved successfully!');
        });

        commentsSectionEl.style.display = 'block';
        renderModuleComments(data.comments);
    };

    // File Upload Handler
    window.handleFileUpload = (input, fileKey) => {
        if (input.files && input.files[0]) {
            const fileName = input.files[0].name;
            const data = getModuleData(currentModule);
            
            if (!data.files) data.files = {};
            data.files[fileKey] = fileName;
            
            auditData[user.department][currentModule] = data;
            setStorage(STORAGE_KEYS.AUDIT, auditData);
            
            // Update UI text immediately
            input.nextElementSibling.innerText = `Current: ${fileName}`;
        }
    };

    // Calculation Helpers
    window.calcExitSurvey = () => {
        const total = Number(document.getElementById('totalGraduated').value) || 0;
        const given = Number(document.getElementById('studentsFeedback').value) || 0;
        const pct = total ? ((given / total) * 100).toFixed(2) : 0;
        document.getElementById('feedbackPct').value = pct + '%';
    };

    window.calcCOPO = () => {
        const direct = Number(document.getElementById('directAtt').value) || 0;
        const indirect = Number(document.getElementById('indirectAtt').value) || 0;
        const final = ((direct + indirect) / 2).toFixed(2);
        document.getElementById('finalAtt').value = final + '%';
    };

    window.calcPlacement = () => {
        const total = Number(document.getElementById('totalFinalYear').value) || 0;
        const placed = Number(document.getElementById('studentsPlaced').value) || 0;
        const pct = total ? ((placed / total) * 100).toFixed(2) : 0;
        document.getElementById('placementPct').value = pct + '%';
    };

    window.calcBudget = () => {
        const allocated = Number(document.getElementById('allocatedBudget').value) || 0;
        const utilized = Number(document.getElementById('utilizedBudget').value) || 0;
        const pct = allocated ? ((utilized / allocated) * 100).toFixed(2) : 0;
        document.getElementById('utilizationPct').value = pct + '%';
    };

    window.calcAdmission = () => {
        const total = Number(document.getElementById('totalIntake').value) || 0;
        const filled = Number(document.getElementById('admissionsFilled').value) || 0;
        const pct = total ? ((filled / total) * 100).toFixed(2) : 0;
        document.getElementById('admissionPct').value = pct + '%';
    };

    const renderModuleComments = (comments) => {
        if (!comments || comments.length === 0) {
            commentsListEl.innerHTML = '<p class="text-muted text-center small my-3">No comments yet.</p>';
            return;
        }

        commentsListEl.innerHTML = comments.map(c => `
            <div class="audit-comment-item">
                <div class="audit-comment-meta">
                    <strong>${c.role}</strong>
                    <span>${formatDate(c.date)}</span>
                </div>
                <div class="small">${c.text}</div>
            </div>
        `).join('');
    };

    commentFormEl.onsubmit = (e) => {
        e.preventDefault();
        if (!currentModule) return;

        const input = document.getElementById('moduleCommentInput');
        const text = input.value.trim();
        if (!text) return;

        const newComment = {
            text: text,
            role: user.role,
            date: new Date().toISOString()
        };

        auditData[user.department][currentModule].comments.unshift(newComment);
        setStorage(STORAGE_KEYS.AUDIT, auditData);
        input.value = '';
        renderModuleComments(auditData[user.department][currentModule].comments);
    };

    renderSidebarList();
};

// 8. Scheduler
const initScheduler = () => {
    const user = getCurrentUser();
    let schedule = getStorage(STORAGE_KEYS.SCHEDULE, []);
    const listContainer = document.getElementById('scheduleList');
    const form = document.getElementById('scheduleForm');

    const render = () => {
        const deptSchedule = schedule.filter(s => s.department === user.department);
        // Sort by date
        deptSchedule.sort((a, b) => new Date(a.date) - new Date(b.date));

        listContainer.innerHTML = deptSchedule.map(s => `
            <div class="card mb-3 border-start border-4 border-primary">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="card-title mb-1">${s.title}</h5>
                            <div class="text-muted small mb-2">
                                <i class="bi bi-calendar"></i> ${formatDate(s.date)} 
                                <i class="bi bi-clock ms-2"></i> ${s.time}
                            </div>
                            <p class="card-text small">${s.description}</p>
                        </div>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteSchedule('${s.id}')"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
            </div>
        `).join('') || '<p class="text-center text-muted">No scheduled events.</p>';
    };

    window.deleteSchedule = (id) => {
        if (confirm('Cancel this event?')) {
            schedule = schedule.filter(s => s.id !== id);
            setStorage(STORAGE_KEYS.SCHEDULE, schedule);
            render();
        }
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newItem = {
            id: generateId(),
            department: user.department,
            title: document.getElementById('schTitle').value,
            date: document.getElementById('schDate').value,
            time: document.getElementById('schTime').value,
            description: document.getElementById('schDesc').value
        };
        schedule.push(newItem);
        setStorage(STORAGE_KEYS.SCHEDULE, schedule);
        form.reset();
        render();
        alert('Event scheduled!');
    });

    render();
};

// --- Main Init ---
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    const user = checkAuth();

    if (page !== 'index.html' && page !== '') {
        const activePage = page.replace('.html', '');
        renderSidebar(activePage);
        updateNotificationBadge();
        checkSystemNotifications();
    }

    if (page === 'index.html' || page === '') initLogin();
    else if (page === 'dashboard.html') initDashboard();
    else if (page === 'meetings.html') initMeetings();
    else if (page === 'syllabus.html') initSyllabus();
    else if (page === 'attendance.html') initAttendance();
    else if (page === 'analysis.html') initAnalysis();
    else if (page === 'audit.html') initAudit();
    else if (page === 'scheduler.html') initScheduler();
});
