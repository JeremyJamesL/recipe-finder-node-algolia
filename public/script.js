const searchBar = document.querySelector(".search-input");
const searchResultsContainer = document.querySelector('.hits');
const filterContainer = document.querySelector('.filters');
const resetButton = document.querySelector('.reset');
const submitButton = document.querySelector('.submit');
const form = document.querySelector('form');
const formContainer = document.querySelector('.addRecipe');
const statusMessage = document.querySelector('.status');
const pagination = document.querySelector('.pagination');
const toggleFormBtn = document.querySelector('.toggleForm');
const untoggleFormBtn = document.querySelector('.close');

// GLOBAL VARIABLES (SEARCH STATE MANAGEMENT)
let q = '';
let filter = ''
let page = 0;
let selectedFilters = [];

// RENDER UI
const renderResults = (hits) => {
  const transformedHits = hits.map(el => {
    return `
    <div class="hit">
      <div class="hitImageContainer" style="background-image: url('${el.image}')">
      </div>
      <div class="hitBody">
        <a href="${el.url}">
          <h2>${el.title}</h2>
        </a>
        <div class="time">⏰ ${el.time}</div>
        <div class="ingredients">${el.primaryIngredients.join(', ')}</div>
      </div>
    </div>
    `
  });

  return transformedHits.join('');
}

const renderFilters = (filters, type) => {
  let title; 
  let html = '';
  let newArr = [];
  let filterNames;
  let filterValues;

  switch(type) {
    case 'cuisine':
        title = 'Cuisine';
        break;
    case 'mainCarb':
        title = 'Main carb';
        break;
    case 'primaryIngredients':
        title = 'Ingredients';
        break;
    default:
        title = 'Filter title'
  }

  if(filters === undefined) {
    html = `<h2>${title}</h2><div>No results</div>`;
    return html;
  } else {
    filterNames = Object.keys(filters);
    filterValues = Object.values(filters);
  }

  // console.log(filterNames);

  filterNames.forEach((key, index) => {
    newArr.push({
      filterName: key,
      value: filterValues[index]
    })
  });

  console.log(newArr);

  html += `<h2>${title}</h2><ul>`

  const filterHtml = newArr.map(el => {
    return `
      <li class="filter">
        <input type="checkbox" id="${el.filterName}" class="filterCheckbox" data-filter-type="${type}" ${selectedFilters.includes(el.filterName) ? 'checked' : ''}/>
        <label for="${el.filterName}">${el.filterName}</label>
        <span class="count">${el.value}</span>
      </li>
    ` 
  }).join('');

  html += filterHtml;
  html += "</ul>";

  return html;
}

const renderPagination = (pageData) => {
    const numberOfPages = pageData.numPages;
    let html = '';
    for(let i = 0; i < numberOfPages; i++) {
        const btnActiveClassid = i === page ? 'active' : '';
        html += `<button class="paginationBtn ${btnActiveClassid}" id=${i}>${i}</button>`
    }
    return html;
}

// HANDLE SEARCH REQUEST
const handleQuery = async() => { 

  //1. Retrieve search response
  const response = await fetch(`http://localhost:5000/search`, {
    method: 'POST',
    headers: {
        "Content-type": "application/json"
    },
    body: JSON.stringify({
        query: q || '',
        filters: filter,
        page: page,
        facets: [ 
            'cuisine',
            'mainCarb',
            'primaryIngredients',
            'time'
        ]
    })
  });
  const data = await response.json();

  // 2. Create html
  const recipesHTML = renderResults(data.hits);
  const cuisineFiltersHTML = renderFilters(data.facets.cuisine, 'cuisine');
  const carbFiltersHTML = renderFilters(data.facets.mainCarb, 'mainCarb');
  const ingredientsFiltersHTML = renderFilters(data.facets.primaryIngredients, 'primaryIngredients');
  const paginationHTML = renderPagination(data.pageData);


  // 3. Inject html
  searchResultsContainer.innerHTML = recipesHTML;
  filterContainer.innerHTML = cuisineFiltersHTML;
  filterContainer.innerHTML += carbFiltersHTML;
  filterContainer.innerHTML += ingredientsFiltersHTML;
  pagination.innerHTML = paginationHTML;
};

// UPDATE SEARCH PARAMETERS
const updateQuery = (e) => {
  q = e.target.value;
  handleQuery();
}

const navigatePage = (e) => {
  page = 1;
  handleQuery();
}

const resetFilters = () => {
  filter = '';
  selectedFilters = [];
  handleQuery();
}

const handlePagination = (e) => {
  if(e.target.classList.contains('paginationBtn')) {
    page = e.target.id * 1;
  }
  handleQuery();
}

const updateFilter = (e) => {
  if(e.target.classList.contains('filterCheckbox')) {
    
    // 1. Get filter data
    const activeFilter = `${e.target.dataset.filterType}:'${e.target.id}'`;

    // 2. Add filters to active Filters (this is used for state management of selected checkboxes)
    selectedFilters.push(e.target.id);
    
    // 3. Set global filter
    if(filter === '') {
      filter = activeFilter;
    } else {
      filter += `AND ${activeFilter}`
    }

    handleQuery();
  } else return;
}

// INDEXING NEW RECIPES
const addRecipe = async(e) => {

  e.preventDefault();
  
  const newRecipeObject = {
    objectID: Date.now(),
    title: form.elements[0].value,
    cuisine: form.elements[1].value,
    ingredients: form.elements[2].value.split(','),
    mainCarb: form.elements[3].value,
    url: form.elements[4].value,
    image: form.elements[5].value,
    time: form.elements[5].value,
  }
  const response = await fetch('http://localhost:5000/recipes', {
    method: "POST", 
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify({
        newRecipeObject
  })
  });

  data = await response.json();

  // Update DOM based on response
  if(data.status === 'success') {
    statusMessage.innerHTML = `<span class="message-success">Successfully indexed recipe: ${data.recipeName}</span>`
  } else if(data.status === 'error') {
    statusMessage.innerHTML = '<span class="message-error">Failed to add recipe, contact the developer</span>'
  }
}

// EVENT LISTENERS
searchBar.addEventListener("input", updateQuery);
document.addEventListener('DOMContentLoaded', handleQuery);
filterContainer.addEventListener('click', updateFilter);
resetButton.addEventListener('click', resetFilters);
submitButton.addEventListener('click', addRecipe);
pagination.addEventListener('click', handlePagination);
toggleFormBtn.addEventListener('click', () => { 
  if(formContainer.classList.contains('close')) {
    formContainer.classList.remove('close');
  }
  formContainer.classList.add('open')
});
untoggleFormBtn.addEventListener('click', (e) => {
  e.preventDefault();
  formContainer.classList.remove('open');
  formContainer.classList.add('close');
});

