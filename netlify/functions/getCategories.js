const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get all categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('id');

    if (catError) throw catError;

    // Get all nominees
    const { data: nominees, error: nomError } = await supabase
      .from('nominees')
      .select('*')
      .order('category_id, id');

    if (nomError) throw nomError;

    // Group nominees by category
    const categoriesWithNominees = categories.map(category => ({
      ...category,
      nominees: nominees.filter(nom => nom.category_id === category.id)
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(categoriesWithNominees)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};