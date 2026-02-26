document.addEventListener('DOMContentLoaded', () => {
    const studentForm = document.getElementById('studentForm');
    const studentTable = document.querySelector('#studentTable tbody');
    const SECRET_PASSWORD = "admin123"; // Set your delete password here

    let students = JSON.parse(localStorage.getItem('havenStudents')) || [];
    renderTable();

    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('studentName').value.trim();
        const dob = document.getElementById('studentDOB').value;

        // --- NEW: DUPLICATE CHECK ---
        const isDuplicate = students.some(s => s.name.toLowerCase() === name.toLowerCase());
        if (isDuplicate) {
            alert("Error: A student with this name is already enrolled!");
            return; // Stops the function here
        }

        const newStudent = {
            id: 'STU-' + Math.floor(Math.random() * 1000),
            name: name,
            dob: dob,
            age: calculateAge(dob),
            gender: document.getElementById('studentGender').value,
            cell: document.getElementById('studentCell').value,
            address: document.getElementById('studentAddress').value,
            grade: document.getElementById('studentGrade').value,
            fees: document.getElementById('feeStatus').value
        };

        students.push(newStudent);
        localStorage.setItem('havenStudents', JSON.stringify(students));
        studentForm.reset();
        renderTable();
    });

    // --- NEW: DELETE WITH PASSWORD ---
    window.deleteStudent = (id) => {
        const password = prompt("Enter Admin Password to delete this record:");
        
        if (password === SECRET_PASSWORD) {
            students = students.filter(student => student.id !== id);
            localStorage.setItem('havenStudents', JSON.stringify(students));
            renderTable();
        } else if (password !== null) {
            alert("Incorrect Password! Access Denied.");
        }
    };

    window.markAsPaid = (id) => {
        const student = students.find(s => s.id === id);
        if (student) {
            student.fees = 'Paid';
            localStorage.setItem('havenStudents', JSON.stringify(students));
            renderTable();
        }
    };

    window.printReceipt = (id) => {
        const student = students.find(s => s.id === id);
        if (!student) return;
        const receiptWindow = window.open('', '_blank', 'width=600,height=600');
        receiptWindow.document.write(`<html><body onload="window.print()"><h2>Receipt: ${student.name}</h2><p>ID: ${student.id}</p><p>Status: PAID</p></body></html>`);
        receiptWindow.document.close();
    };

    function calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    }

    function renderTable() {
        studentTable.innerHTML = '';
        if (students.length === 0) {
            studentTable.innerHTML = '<tr><td colspan="4" style="text-align:center;">No records found.</td></tr>';
            return;
        }

        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td><strong>${student.name}</strong><br><small>${student.gender} | Age: ${student.age}</small></td>
                <td>${student.grade}</td>
                <td>
                    <span class="${student.fees === 'Paid' ? 'status-paid' : 'status-pending'}">${student.fees}</span>
                    <div style="margin-top: 5px;">
                        ${student.fees === 'Pending' ? `<button onclick="markAsPaid('${student.id}')" class="btn-paid">Mark Paid</button>` : `<button onclick="printReceipt('${student.id}')" class="btn-print">Receipt</button>`}
                        <button onclick="deleteStudent('${student.id}')" style="background:#e74c3c; color:white; border:none; padding:5px; border-radius:3px; cursor:pointer; font-size:11px; margin-left:5px;">Delete</button>
                    </div>
                </td>
            `;
            studentTable.appendChild(row);
        });
    }
});