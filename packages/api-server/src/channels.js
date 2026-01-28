'use strict';

/**
 * Socket.io channel configuration for real-time events
 */
module.exports = function(app) {
  if (typeof app.channel !== 'function') {
    return;
  }

  // Join authenticated users to their site channel
  app.on('connection', (connection) => {
    app.channel('anonymous').join(connection);
  });

  app.on('login', (authResult, { connection }) => {
    if (connection) {
      // Leave anonymous channel
      app.channel('anonymous').leave(connection);

      // Join authenticated channel
      app.channel('authenticated').join(connection);

      // Join site-specific channel
      if (authResult.user && authResult.user.siteId) {
        app.channel(`site/${authResult.user.siteId}`).join(connection);
      }

      // Join user-specific channel
      if (authResult.user && authResult.user.id) {
        app.channel(`user/${authResult.user.id}`).join(connection);
      }
    }
  });

  // Ticket events - publish to site channel
  app.service('api/tickets').publish((data, hook) => {
    return app.channel(`site/${data.siteId}`);
  });

  // Default - publish all events to authenticated users
  app.publish((data, hook) => {
    return app.channel('authenticated');
  });
};
