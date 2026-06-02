export async function onRequestPost(context) {
  var STRIPE_SECRET_KEY = context.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    var body = await context.request.json();
    var items = body.items || [];
    var deliveryCost = body.deliveryCost || 0;
    var customerName = body.customerName || '';
    var customerPhone = body.customerPhone || '';
    var customerAddress = body.customerAddress || '';
    var orderId = body.orderId || '';

    var line_items = items.filter(function(item) { return item.type !== 'custom_package'; }).map(function(item) {
      return {
        price_data: {
          currency: 'ils',
          product_data: { name: item.name || 'منتج' },
          unit_amount: Math.round((item.price || 0) * 100)
        },
        quantity: item.qty || 1
      };
    });

    if (deliveryCost > 0) {
      line_items.push({
        price_data: {
          currency: 'ils',
          product_data: { name: 'رسوم التوصيل' },
          unit_amount: Math.round(deliveryCost * 100)
        },
        quantity: 1
      });
    }

    if (line_items.length === 0) {
      return new Response(JSON.stringify({ error: 'No payable items' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    var origin = new URL(context.request.url).origin;

    var stripeBody = new URLSearchParams();
    stripeBody.append('payment_method_types[]', 'card');
    stripeBody.append('mode', 'payment');
    stripeBody.append('success_url', origin + '/confirmation.html?payment=success&order=' + orderId);
    stripeBody.append('cancel_url', origin + '/checkout.html?payment=cancelled');
    stripeBody.append('metadata[orderId]', orderId);
    stripeBody.append('metadata[customerName]', customerName);
    stripeBody.append('metadata[customerPhone]', customerPhone);

    line_items.forEach(function(item, i) {
      stripeBody.append('line_items[' + i + '][price_data][currency]', item.price_data.currency);
      stripeBody.append('line_items[' + i + '][price_data][product_data][name]', item.price_data.product_data.name);
      stripeBody.append('line_items[' + i + '][price_data][unit_amount]', item.price_data.unit_amount);
      stripeBody.append('line_items[' + i + '][quantity]', item.quantity);
    });

    var stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(STRIPE_SECRET_KEY + ':'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: stripeBody.toString()
    });

    var session = await stripeResponse.json();

    if (session.error) {
      return new Response(JSON.stringify({ error: session.error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
