document.addEventListener('DOMContentLoaded', () => {
    const studentForm = document.getElementById('studentForm');
    const paymentForm = document.getElementById('paymentForm');
    const settingsForm = document.getElementById('settingsForm');
    const tableBody = document.getElementById('tableBody');
    const selectStudent = document.getElementById('selectStudent');
    const btnPrintDirectory = document.getElementById('btnPrintDirectory');
    
    // Filter Elements
    const filterGrade = document.getElementById('filterGrade');
    const filterGender = document.getElementById('filterGender');
    const filterBalance = document.getElementById('filterBalance');
    const applyBtn = document.getElementById('applyFilters');
    const clearBtn = document.getElementById('clearFilters');
    
    // Data Storage
    let students = JSON.parse(localStorage.getItem('havenStudents')) || [];
    let settings = JSON.parse(localStorage.getItem('havenSettings')) || { 
        schoolName: "Haven School", 
        adminPassword: "admin123", 
        logo: "",
        idPrefix: "HAV",
        nextIdNum: 1000
    };

    applySettings();
    refreshUI();

    // --- 1. ADMIN SECURITY LOGIC ---
    document.getElementById('btnUnlockSettings').addEventListener('click', () => {
        const pw = prompt("Enter Admin Password to access system settings:");
        if (pw === settings.adminPassword) {
            document.getElementById('settings').style.display = 'block';
            document.getElementById('setSchoolName').value = settings.schoolName;
            document.getElementById('setPrefix').value = settings.idPrefix;
            document.getElementById('setStartNum').value = settings.nextIdNum;
        } else if (pw !== null) {
            alert("Incorrect Password!");
        }
    });

    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        settings.schoolName = document.getElementById('setSchoolName').value || settings.schoolName;
        settings.adminPassword = document.getElementById('setAdminPassword').value || settings.adminPassword;
        settings.idPrefix = document.getElementById('setPrefix').value.toUpperCase() || settings.idPrefix;
        settings.nextIdNum = parseInt(document.getElementById('setStartNum').value) || settings.nextIdNum;
        
        const logoFile = document.getElementById('setSchoolLogo').files[0];
        if (logoFile) {
            const reader = new FileReader();
            reader.onload = () => {
                settings.logo = reader.result;
                finalizeSettings();
            };
            reader.readAsDataURL(logoFile);
        } else {
            finalizeSettings();
        }
    });

    function finalizeSettings() {
        localStorage.setItem('havenSettings', JSON.stringify(settings));
        applySettings();
        document.getElementById('settings').style.display = 'none'; 
        alert("Settings Saved and Locked!");
        settingsForm.reset();
    }

    function applySettings() {
        document.getElementById('displaySchoolName').innerText = settings.schoolName;
        if (settings.logo) {
            document.getElementById('displayLogo').src = settings.logo;
            document.getElementById('displayLogo').style.display = 'block';
        }
    }

    // --- 2. ENROLLMENT (WITH AUTO ID) ---
    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const stdNumber = `${settings.idPrefix}${settings.nextIdNum}`;
        settings.nextIdNum++; 
        localStorage.setItem('havenSettings', JSON.stringify(settings));

        const newStudent = {
            id: stdNumber,
            name: document.getElementById('studentName').value.trim(),
            grade: document.getElementById('studentGrade').value,
            gender: document.getElementById('studentGender').value,
            cell: document.getElementById('studentCell').value,
            ledger: [{ 
                date: new Date().toISOString().split('T')[0], 
                term: document.getElementById('enrollTerm').value, 
                desc: 'Initial Tuition', 
                amount: parseFloat(document.getElementById('totalFees').value), 
                type: 'charge' 
            }]
        };

        students.push(newStudent);
        localStorage.setItem('havenStudents', JSON.stringify(students));
        refreshUI();
        studentForm.reset();
        alert(`Student Enrolled! STD Number is: ${stdNumber}`);
    });

    // --- 3. PAYMENT & ADVANCED RECEIPT ---
    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = selectStudent.value;
        const amount = parseFloat(document.getElementById('payAmount').value);
        const ref = document.getElementById('payRef').value || "Tuition Payment";
        const term = document.getElementById('payTerm').value;
        const payDate = new Date().toISOString().split('T')[0];

        const student = students.find(s => s.id === id);
        if (student) {
            student.ledger.push({ date: payDate, term: term, desc: ref, amount: amount, type: 'payment' });
            localStorage.setItem('havenStudents', JSON.stringify(students));
            refreshUI();
            
            printAdvancedReceipt(student, amount, ref, payDate);
            paymentForm.reset();
        }
    });

    function printAdvancedReceipt(student, amountPaidNow, description, dateStr) {
        let totalCharges = 0, totalPaid = 0;
        let historyHTML = '';
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        student.ledger.forEach(l => {
            if (l.type === 'charge') totalCharges += l.amount;
            if (l.type === 'payment') totalPaid += l.amount;
            if (new Date(l.date) >= oneYearAgo) {
                historyHTML += `<tr><td>${l.date}</td><td>${l.term} - ${l.desc}</td><td>${l.type === 'charge' ? '$'+l.amount : ''}</td><td>${l.type === 'payment' ? '$'+l.amount : ''}</td></tr>`;
            }
        });

        const amountDue = totalCharges - totalPaid;
        const logoImg = settings.logo ? `<img src="${settings.logo}" style="width:60px; height:60px; object-fit:cover; border-radius:50%; position:absolute; top:20px; left:20px;">` : '';

        const win = window.open('', '', 'width=800,height=600');
        win.document.write(`
            <html><head><style>
                body { font-family: Arial, sans-serif; padding: 40px; position: relative; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #f4f4f4; }
                .receipt-box { border: 2px solid #333; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            </style></head><body>
                ${logoImg}
                <h2 style="text-align:center; margin:0;">${settings.schoolName}</h2>
                <p style="text-align:center; margin:5px 0 20px 0; color:#555;">Official Payment Receipt</p>
                <div class="receipt-box">
                    <p><strong>Date:</strong> ${dateStr}</p>
                    <p><strong>STD Number:</strong> ${student.id} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Name:</strong> ${student.name}</p>
                    <p><strong>Grade:</strong> ${student.grade}</p>
                    <hr style="border:0; border-top:1px dashed #ccc; margin:15px 0;">
                    <h3>Payment Details</h3>
                    <p><strong>Description:</strong> ${description}</p>
                    <p><strong>Amount Paid Today:</strong> <span style="font-size:18px; font-weight:bold; color:green;">$${amountPaidNow.toFixed(2)}</span></p>
                    <p><strong>Current Total Due (Balance):</strong> <span style="color:red;">$${amountDue.toFixed(2)}</span></p>
                </div>
                <h3>Payment History (Last 12 Months)</h3>
                <table><tr><th>Date</th><th>Description</th><th>Charge</th><th>Payment</th></tr>${historyHTML}</table>
                <p style="text-align:center; margin-top:30px; font-style:italic;">Thank you.</p>
            </body></html>
        `);
        win.document.close();
        win.setTimeout(() => { win.print(); }, 500); 
    }

    // --- 4. REPORTING LOGIC ---
    window.generateReport = (type) => {
        const out = document.getElementById('reportOutput');
        let totalCollected = 0;
        let count = 0;
        const todayStr = new Date().toISOString().split('T')[0];
        const currentMonth = todayStr.substring(0, 7);
        const currentYear = todayStr.substring(0, 4);
        const termVal = document.getElementById('reportTerm').value;

        students.forEach(s => {
            s.ledger.forEach(l => {
                if (l.type === 'payment') {
                    let match = false;
                    if (type === 'daily' && l.date === todayStr) match = true;
                    if (type === 'monthly' && l.date.startsWith(currentMonth)) match = true;
                    if (type === 'yearly' && l.date.startsWith(currentYear)) match = true;
                    if (type === 'termly' && l.term === termVal) match = true;

                    if (match) { totalCollected += l.amount; count++; }
                }
            });
        });

        out.innerHTML = `
            <h4 style="margin-bottom:10px; text-transform:capitalize;">${type} Revenue Report</h4>
            <p><strong>Total Transactions Found:</strong> ${count}</p>
            <p style="font-size:18px;"><strong>Total Revenue Collected:</strong> <span style="color:#27ae60;">$${totalCollected.toFixed(2)}</span></p>
        `;
    };

    // --- 5. PRINT DIRECTORY ---
    btnPrintDirectory.addEventListener('click', () => { window.print(); });

    // --- 6. FILTER LOGIC (GRADE, GENDER & BALANCE) ---
    applyBtn.addEventListener('click', () => {
        const gradeVal = filterGrade.value;
        const genderVal = filterGender.value;
        const balVal = filterBalance.value;
        
        const filtered = students.filter(s => {
            const gradeMatch = (gradeVal === "All" || s.grade === gradeVal);
            const genderMatch = (genderVal === "All" || s.gender === genderVal);
            
            let totalCharges = 0, totalPaid = 0;
            s.ledger.forEach(l => {
                if (l.type === 'charge') totalCharges += l.amount;
                if (l.type === 'payment') totalPaid += l.amount;
            });
            const bal = totalCharges - totalPaid;
            
            let balMatch = false;
            if (balVal === "All") balMatch = true;
            if (balVal === "Arrears" && bal > 0) balMatch = true;
            if (balVal === "Paid" && bal <= 0) balMatch = true;

            return gradeMatch && genderMatch && balMatch;
        });
        
        renderTable(filtered);
    });

    clearBtn.addEventListener('click', () => {
        filterGrade.value = "All";
        filterGender.value = "All";
        filterBalance.value = "All";
        renderTable(students);
    });

    // --- 7. UI REFRESH & DRAWING ---
    function refreshUI() {
        renderTable(students);
        updateDropdowns();
    }

    function renderTable(dataToDraw) {
        tableBody.innerHTML = '';
        if(dataToDraw.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:15px;">No students match this filter.</td></tr>';
            return;
        }

        dataToDraw.forEach(s => {
            let totalCharges = 0, totalPaid = 0;
            s.ledger.forEach(l => {
                if (l.type === 'charge') totalCharges += l.amount;
                if (l.type === 'payment') totalPaid += l.amount;
            });
            const bal = totalCharges - totalPaid;
            
            tableBody.innerHTML += `
                <tr>
                    <td><strong>${s.id}</strong></td>
                    <td><strong>${s.name}</strong><br><small>${s.gender} | ${s.cell}</small></td>
                    <td>${s.grade}</td>
                    <td><small>Due: $${totalCharges}<br>Paid: $${totalPaid}<br><strong>Bal: $${bal}</strong></small></td>
                    <td class="hide-on-print">
                        <span class="${bal <= 0 ? 'status-paid' : (totalPaid > 0 ? 'status-partial' : 'status-pending')}">${bal <= 0 ? 'PAID' : 'DUE'}</span>
                    </td>
                </tr>
            `;
        });
    }

    function updateDropdowns() {
        selectStudent.innerHTML = '<option value="">Select Student</option>';
        students.forEach(s => {
            selectStudent.innerHTML += `<option value="${s.id}">${s.name} (${s.id})</option>`;
        });
    }
});