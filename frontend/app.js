const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:5000';
const propertyGrid = document.getElementById('propertyGrid');
const agentGrid = document.getElementById('agentGrid');
const enquiryForm = document.getElementById('enquiryForm');
const statusMessage = document.getElementById('statusMessage');

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Request failed');
  }

  return response.json();
}

function propertyCard(property) {
  return `
    <article class="card property-card">
      <img src="${property.image}" alt="${property.title}" />
      <div class="card-body">
        <div class="meta-row">
          <span class="badge">${property.type}</span>
          <span class="price">$${Number(property.price).toLocaleString()}</span>
        </div>
        <h3>${property.title}</h3>
        <p class="location">📍 ${property.location}</p>
        <p class="description">${property.description}</p>
        <div class="stats">
          <span>${property.bedrooms} Beds</span>
          <span>${property.bathrooms} Baths</span>
          <span>${property.area} sq ft</span>
        </div>
      </div>
    </article>
  `;
}

function agentCard(agent) {
  return `
    <article class="card agent-card">
      <div class="agent-avatar">${agent.name.charAt(0)}</div>
      <div class="agent-content">
        <h3>${agent.name}</h3>
        <p class="role">${agent.role}</p>
        <p>${agent.bio}</p>
        <ul>
          <li>${agent.phone}</li>
          <li>${agent.email}</li>
        </ul>
      </div>
    </article>
  `;
}

async function loadProperties() {
  try {
    const properties = await fetchJson(`${API_BASE_URL}/api/properties`);
    propertyGrid.innerHTML = properties.map(propertyCard).join('');
  } catch (error) {
    propertyGrid.innerHTML = '<p class="error">Could not load listings right now.</p>';
    console.error(error);
  }
}

async function loadAgents() {
  try {
    const agents = await fetchJson(`${API_BASE_URL}/api/agents`);
    agentGrid.innerHTML = agents.map(agentCard).join('');
  } catch (error) {
    agentGrid.innerHTML = '<p class="error">Could not load agents right now.</p>';
    console.error(error);
  }
}

enquiryForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(enquiryForm);
  const payload = {
    name: formData.get('name'),
    email: formData.get('email'),
    propertyId: formData.get('propertyId') || null,
    message: formData.get('message') || ''
  };

  try {
    const result = await fetch(`${API_BASE_URL}/api/enquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const response = await result.json();

    if (!result.ok) {
      throw new Error(response.error || 'Unable to send enquiry');
    }

    statusMessage.textContent = response.message;
    statusMessage.classList.add('success');
    enquiryForm.reset();
  } catch (error) {
    statusMessage.textContent = error.message;
    statusMessage.classList.add('error');
  }
});

loadProperties();
loadAgents();
