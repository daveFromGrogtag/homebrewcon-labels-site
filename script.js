

let labels = JSON.parse(localStorage.getItem('kegLabels')) || [];

const overlay = document.getElementById('overlay');
const labelsContainer = document.getElementById('labelsContainer');
const labelForm = document.getElementById('labelForm');

function openOverlay(index = -1) {

    document.getElementById('labelIndex').value = index;

    if (index >= 0) {

        const label = labels[index];

        document.getElementById('event').value = label.event;
        document.getElementById('clubName').value = label.clubName;
        document.getElementById('location').value = label.location;
        document.getElementById('beerName').value = label.beerName;
        document.getElementById('beerStyle').value = label.beerStyle;
        document.getElementById('day').value = label.day;
        document.getElementById('time').value = label.time;

    } else {

        labelForm.reset();

    }

    overlay.classList.add('active');
}

function closeOverlay() {
    overlay.classList.remove('active');
}

function saveLabels() {
    localStorage.setItem('kegLabels', JSON.stringify(labels));
}

function renderLabels() {

    labelsContainer.innerHTML = '';

    if (labels.length === 0) {

        labelsContainer.innerHTML = `
                <div class="label-card">
                    No labels added yet.
                </div>
            `;

        return;
    }

    labels.forEach((label, index) => {

        const labelCard = document.createElement('div');
        labelCard.className = 'label-card';

        labelCard.innerHTML = `
                <div class="label-top">

                    <div class="beer-name">
                        ${label.beerName} x ${label.labelQuantity}
                    </div>

                    <div class="event-tag">
                        ${label.event}
                    </div>

                </div>

                <div class="details">

                    <div class="detail">
                        <strong>Club Name</strong>
                        ${label.clubName}
                    </div>

                    <div class="detail">
                        <strong>Location</strong>
                        ${label.location}
                    </div>

                    <div class="detail">
                        <strong>Beer Style</strong>
                        ${label.beerStyle}
                    </div>

                    <div class="detail">
                        <strong>Schedule</strong>
                        ${label.day} • ${formatTime(label.time)}
                    </div>

                </div>

                <div class="button-row">

                    <button 
                        class="edit-button" 
                        type="button"
                        onclick="openOverlay(${index})"
                    >
                        Edit Info
                    </button>

                    <button 
                        class="edit-button" 
                        type="button"
                        onclick="deleteLabel(${index})"
                    >
                        Delete
                    </button>

                </div>
            `;

        labelsContainer.appendChild(labelCard);

    });

}

function deleteLabel(index) {

    if (!confirm('Delete this label?')) {
        return;
    }

    labels.splice(index, 1);

    saveLabels();
    renderLabels();
}

function formatTime(time) {

    if (!time) {
        return '';
    }

    const [hours, minutes] = time.split(':');

    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';

    hour = hour % 12;
    hour = hour ? hour : 12;

    return `${hour}:${minutes} ${ampm}`;
}

labelForm.addEventListener('submit', function (event) {

    event.preventDefault();

    if (!labelForm.checkValidity()) {

        labelForm.reportValidity();

        return;
    }

    const labelData = {

        event: document.getElementById('event').value,
        clubName: document.getElementById('clubName').value,
        location: document.getElementById('location').value,
        beerName: document.getElementById('beerName').value,
        beerStyle: document.getElementById('beerStyle').value,
        labelQuantity: document.getElementById('labelQuantity').value,
        day: document.getElementById('day').value,
        time: document.getElementById('time').value

    };

    const index = parseInt(document.getElementById('labelIndex').value);

    if (index >= 0) {

        labels[index] = labelData;

    } else {

        labels.push(labelData);

    }

    saveLabels();

    renderLabels();

    closeOverlay();

});


async function submitOrder() {

    const deliveryForm = document.getElementById('deliveryForm');

    if (!deliveryForm.checkValidity()) {

        deliveryForm.reportValidity();

        return;
    }

    if (labels.length === 0) {

        alert('Please add at least one keg label.');

        return;
    }

    const orderData = {

        delivery: {

            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            // address1: document.getElementById('address1').value.trim(),
            // city: document.getElementById('city').value.trim(),
            // state: document.getElementById('state').value.trim(),
            // zip: document.getElementById('zip').value.trim(),
            // country: document.getElementById('country').value.trim()

        },

        labels: labels,

        createdAt: serverTimestamp()

    };

    console.log('ORDER SUBMISSION');
    console.log(orderData);

    try {

        const docRef = await addDoc(
            collection(db, 'orderSubmissions'),
            orderData
        );

        console.log('Firestore document written:', docRef.id);

        alert('Order submitted successfully.');

        localStorage.removeItem('kegLabels');

        labels = [];

        renderLabels();

        deliveryForm.reset();

        createEmailNotification(orderData, docRef.id)

    } catch (error) {

        console.error('Error submitting order:', error);

        alert('Error submitting order.');

    }

}

function buildConfirmationEmail(orderData, docId) {

    const labelsRows = orderData.labels.map(label => {

        return `
            <tr>
                <td style="padding:12px;border:1px solid #ddd;">
                    ${label.event}
                </td>

                <td style="padding:12px;border:1px solid #ddd;">
                    ${label.clubName}
                </td>

                <td style="padding:12px;border:1px solid #ddd;">
                    ${label.location}
                </td>

                <td style="padding:12px;border:1px solid #ddd;">
                    ${label.beerName}
                </td>

                <td style="padding:12px;border:1px solid #ddd;">
                    ${label.beerStyle}
                </td>

                <td style="padding:12px;border:1px solid #ddd;">
                    ${label.day}
                </td>

                <td style="padding:12px;border:1px solid #ddd;">
                    ${formatTime(label.time)}
                </td>
            </tr>
        `;

    }).join('');

    return `<!DOCTYPE html>

    <html>

    <head>

        <meta charset="UTF-8">

        <title>HomebrewCon Keg Label Confirmation</title>

    </head>

    <body style="
        margin:0;
        padding:0;
        background:#0f0f10;
        font-family:Arial, Helvetica, sans-serif;
        color:#ffffff;
    ">

        <div style="
            max-width:900px;
            margin:40px auto;
            background:#141416;
            border-radius:18px;
            overflow:hidden;
            border-top:4px solid #c1121f;
        ">

            <div style="
                padding:40px;
            ">

                <div style="
                    display:inline-block;
                    background:rgba(193,18,31,0.15);
                    color:#ff6b6b;
                    border:1px solid rgba(255,107,107,0.25);
                    padding:8px 14px;
                    border-radius:999px;
                    font-size:12px;
                    letter-spacing:1px;
                    text-transform:uppercase;
                    margin-bottom:20px;
                ">
                    Order Confirmation
                </div>

                <h1 style="
                    margin:0 0 10px 0;
                    font-size:36px;
                    line-height:1.1;
                ">
                    HomebrewCon Keg Labels
                </h1>

                <p style="
                    color:#b5b5b8;
                    line-height:1.7;
                    margin-bottom:30px;
                ">
                    Your keg label order has been received successfully.
                </p>

                <div style="background:#18181b;border:1px solid #2f2f35;border-radius:14px;padding:20px;margin-bottom:30px;">

                    <p style="margin:0 0 12px 0;">
                        <strong>Name:</strong>
                        ${orderData.delivery.fullName}
                    </p>

                    <p style="margin:0 0 12px 0;">
                        <strong>Email:</strong>
                        ${orderData.delivery.email}
                    </p>

                    <p style="margin:0;">
                        <strong>Order ID:</strong>
                        ${docId}
                    </p>

                </div>

                <h2 style="
                    margin-bottom:20px;
                    font-size:24px;
                ">
                    Submitted Labels
                </h2>

                <table style="
                    width:100%;
                    border-collapse:collapse;
                    background:#18181b;
                    border:1px solid #2f2f35;
                    border-radius:14px;
                    overflow:hidden;
                ">

                    <thead>

                        <tr style="
                            background:#c1121f;
                            color:white;
                        ">

                            <th style="padding:14px;border:1px solid #444;text-align:left;">
                                Event
                            </th>

                            <th style="padding:14px;border:1px solid #444;text-align:left;">
                                Club
                            </th>

                            <th style="padding:14px;border:1px solid #444;text-align:left;">
                                Location
                            </th>

                            <th style="padding:14px;border:1px solid #444;text-align:left;">
                                Beer
                            </th>

                            <th style="padding:14px;border:1px solid #444;text-align:left;">
                                Style
                            </th>

                            <th style="padding:14px;border:1px solid #444;text-align:left;">
                                Day
                            </th>

                            <th style="padding:14px;border:1px solid #444;text-align:left;">
                                Time
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${labelsRows}

                    </tbody>

                </table>

                <p style="
                    color:#888;
                    margin-top:30px;
                    line-height:1.7;
                    font-size:14px;
                ">
                    Please review your information carefully. If changes are needed,
                    contact the event organizers before production begins.
                </p>

            </div></div></body></html>`}

async function createEmailNotification(orderData, docId) {

    let htmlMessage = buildConfirmationEmail(orderData, docId)
    console.log("Creating Notification Email...");
    try {
        addDoc(collection(db, "mail"), {
            to: orderData.delivery.email,
            cc: ["dave@grogtag.com"],
            bcc: "orders@grogtag.com",
            message: {
                subject: "HomeBrewCon Keg Label Order Confirmation",
                html: htmlMessage
            }
        }).then(() => {
            console.log("Message Sent");
        })

    } catch (error) {
        console.error(error);
    }
}

renderLabels();