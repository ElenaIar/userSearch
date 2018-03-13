/*
* PubSub.
* The function performs actions to send changes
* to the modules and signs other modules to events.
*/ 
( function( $ ){
 var o = $( {} );
 $.each( {
  trigger: 'publish',
  on: 'subscribe',
  off: 'unsubscribe'
 }, function( key, val ){
  jQuery[val] = function(){
    o[key].apply( o, arguments );
  }
 } );
} )( jQuery );

/*
* Template for conclusion html.
*/
function Template( obj ){

  var args = obj;

  var template = `
    <h3>` + args.shortName + `. ` + args.lastName + `</h3>
    <div class="media">
      <div style="float: left;">
        <img class="mr-3" src="./assets/images/users/` + args.photo + `" alt="Generic placeholder image">
        <h5 class="mt-0">` + args.name + ` ` + args.lastName + `</h5>
        <h6 class="mt-0">Date of birth: ` + args.dateOfBirth + `</h6>
        <h6 class="mt-0">Age: <b>` + args.age + `</b></h6>
        <h6 class="mt-0">Position: <b>` + args.position + `</b></h6>
      </div>
      <div class="media-body">
          <p>` + args.personalInformation + `</p>
      </div>
    </div>
  `;

  return template;

};

/*
* Connector.
* The module performs the connection action.
* It receives events from other modules and sends ads to everyone who subscribed to it.
*/ 
var Connector = ( function(){

  return {

    selectNumber: parseInt( $( '#numberOfItems' ).val() ), // user can to change number of elements on the page

    activePage: 1, // active page

    countPage: 0, // count page

    searchQuery: '', // search query

    init: function(){

      var _this = this;

      // run getJSON function
      _this.runGetUsersData( _this.selectNumber, _this.activePage, _this.searchQuery );

      /*
      * Subscribe to the navigation events.
      */ 
      $.subscribe( 'paginationEvent', function( e, obj ){

        _this.activePage = obj.activePage;

        // run getUserData function
        _this.runGetUsersData( _this.selectNumber, _this.activePage, _this.searchQuery );

      } );

      /*
      * Subscribe to changes in the number of items on the page.
      */
      $.subscribe( 'changeNumberItemsEvent', function( e, obj ){

        _this.selectNumber = obj.selectNumber;

        _this.activePage = 1;

        // run runGetUsersData function
        _this.runGetUsersData( _this.selectNumber, _this.activePage, _this.searchQuery );

      } );

      /*
      * Search.
      * Subscribe to enter a search query.
      */
      $.subscribe( 'searchUserEvent', function( e, obj ){

        _this.searchQuery = obj.searchQuery;

        _this.activePage = 1;

        // run runGetUsersData function
        _this.runGetUsersData( _this.selectNumber, _this.activePage, _this.searchQuery );

      } );

      /*
      **********************************************/

      /**********************************************
      * Subscribe to a data collection event
      */ 
      $.subscribe( 'getUsersEvent', function( e, obj ){

        _this.selectNumber = obj.selectNumber;

        _this.activePage = obj.activePage;

        _this.countPage = obj.countPage;

        _this.publishConnector();

      } );

    },

    /*
    * Send messages to all modules.
    */
    publishConnector: function(){

      var _this = this;

      var obj = {

        selectNumber: _this.selectNumber,

        activePage: _this.activePage,

        countPage: _this.countPage

      };

      $.publish( 'connectorEvent', obj ); 

    },

    // Receive user data
    runGetUsersData: function( selectNumber, activePage, searchQuery ){

      GetData.getData( selectNumber, activePage, searchQuery );

    }

  }

} )();

/**********************************************
* Receive user data from JSON file and rendering it into DOM.
*/ 
var GetData = ( function(){

  var url = 'assets/js/DB.json'; // JSON file

  var _root = $( '#root' ); // The main element

  var container = '<div id="accordion"></div>'; // Container whit elements

  var $container = {}; // Container variable

  var icons = { // Icons
    header: "ui-icon-circle-arrow-e",
    activeHeader: "ui-icon-circle-arrow-s"
  }; 

  return {

    init: function(){

      var _this = this;

    },

    // The main function for getting user data and rendering.
    getData: function( selectNumber, activePage, searchQuery ){

      var _this = this;

      var timer = null;

      var from = ( activePage * selectNumber ) - selectNumber + 1;

      var to = from + selectNumber - 1;

      var objectItems = {};

      // search query
      var query = searchQuery.toLowerCase();

      // create container
      _root.empty();

      _root.append( container );

      $container = $( '#accordion' );

      var result = $.getJSON( url, function( res ){

        // Sort the data and enters it into object.
        $.each( res.users, function( index, item ){

          if( this.name.toLowerCase().indexOf( query ) !== -1 ){

            objectItems[index] = this;

          } else if( this.lastName.toLowerCase().indexOf( query ) !== -1 ){

            objectItems[index] = this;

          } else if( this.personalInformation.toLowerCase().indexOf( query ) !== -1 ){

            objectItems[index] = this;

          } 

          clearTimeout( timer );

        } );

        // Get sorting data and pass it to the DOM.
        timer = setTimeout( function(){

          var lengthObject = Object.keys( objectItems ).length;

          if( lengthObject <= selectNumber ){

            $.each( objectItems, function( index, item ){

                _this.render( index, item, query );

            } );

            // If nothing found.
            if( lengthObject === 0 ){

              var obj = {
                name: '',
                lastName: '',
                age: '',
                dateOfBirth: '',
                personalInformation: 'Nothing found',
                position: '',
                photo: '404.png'
              }
              
              _this.render( 0, obj, '' );

            }

          } else{

            $.each( objectItems, function( index, item ){

              var numberItem = parseInt( index ) + 1;

              if( numberItem >= from && numberItem <= to ){

                _this.render( index, item, query );

              }

            } );

          }

        }, 400 );        

        // User data playback event.
        $.publish( 'getUsersEvent', {

          selectNumber: selectNumber,

          activePage: activePage,

          countPage: Math.ceil( Object.keys( objectItems ).length / selectNumber )

        } );

      } );

      // Run the accordion script.
      setTimeout( function(){

        $container.accordion( {

          icons: icons,

          heightStyle: 'content'

        } );

        $( '#toggle' ).button().on( 'click', function() {

          if ( $container.accordion( 'option', 'icons' ) ) {

            $container.accordion( 'option', 'icons', null );

          } else {

            $container.accordion( 'option', 'icons', icons );

          }

        });

      },500 );      

    },

    // Data Rendering Function.
    render: function( index, res, query ){
      
      var nameQuery = res.name;

      var lastNameQuery = res.lastName;

      var personalInformationQuery = res.personalInformation;

      // Get the age of the user.
      var _age = res.dateOfBirth.match( /\d\d\d\d/gi );

      var today = new Date();

      var year = today.getFullYear();

      var age = year - _age[0];

      if( query.length > 0 ){

        var reg = new RegExp( query, 'ig' );

        nameQuery = nameQuery.replace( reg, '<strong class="yellow">' + query + '</strong>' );

        lastNameQuery = lastNameQuery.replace( reg, '<strong class="yellow">' + query + '</strong>' );

        personalInformationQuery = personalInformationQuery.replace( reg, '<strong class="yellow">' + query + '</strong>' );

      }      

      var obj = {
        shortName: res.name.substring( 0, 1 ),
        name: nameQuery,
        lastName: lastNameQuery,
        age: age,
        dateOfBirth: res.dateOfBirth,
        personalInformation: personalInformationQuery,
        position: res.position,
        photo: res.photo
      };

      // Add an item to the container.
      $container.append( Template( obj ) );

    }

  }

} )();

/**********************************************
* Function of pagination.
*/ 
var Pagination = ( function(){

  var paginationContainer = $( '#paginationUl' );

  return {

    init: function(){

      var _this = this;

      // Subscribe to the connector Event.
      $.subscribe( 'connectorEvent', function( e, obj ){

        _this.render( obj.countPage, obj.activePage );

      } );

    },

    // The event clicks the link for pagination.
    event: function( element ){

      element.on( 'click', function( e ){

        e.preventDefault();

        var pageN = parseInt( $( this ).attr( 'data-page-number' ) );

        var obj = {

          activePage: pageN

        };

        $.publish( 'paginationEvent' , obj );

      } );

    },

    render: function( countPage, activePage ){

      paginationContainer.empty();

      if( countPage > 1 ){

        var paginationItem = '';

        // set pagination
        for( var i = 1; i <= countPage; i++ ){          

          if( activePage === i ){

            paginationItem = '<li class="page-item active"><span>' + i + '</span></li>';

          } else{

            paginationItem = '<li class="page-item"><a class="page-link" href="#" data-page-number="' + i + '">' + i + '</a></li>';

          }          
          
          paginationContainer.append( paginationItem );

        }

        // event
        this.event( $( '.page-link' ) );

      }      

    }

  }

} )();

/**********************************************
* Select the number of items.
*/
var SelectNumber = ( function(){

  return {

    init: function(){

      var _this = this;

      _this.event();

    },

    event: function(){

      $( '#numberOfItems' ).change( function(){

        var selectNumber = parseInt( $( this ).val() );

        var obj = {

          selectNumber: selectNumber

        };

        $.publish( 'changeNumberItemsEvent', obj );

      } );

    }

  }

} )();

/**********************************************
* Search for users.
*/
var Search = ( function(){

  var timer = '';

  return {

    init: function(){

      var _this = this;

      _this.event();

    },

    event: function(){

      var searchInput = $( '#searchUserInput' );

      var _this = this;

      searchInput.keyup( function( e, query ){
        
        _this.searchUser( searchInput );

      } );

    },

    searchUser: function( searchInput ){

      clearTimeout( timer );

      timer = ( ( searchInput.val().length >= 3 ) || ( searchInput.val().length === 0 ) ) && setTimeout( function(){

        var obj = {

          searchQuery: ( searchInput.val().length === 0 ) ? '' : searchInput.val()

        };

        $.publish( 'searchUserEvent', obj );

      },500 );      

    }

  }

} )();

/**********************************************
* Launch the application.
*/
var App = ( function(){

  return {

    init: function(){

      Pagination.init();
      SelectNumber.init();
      Search.init();
      Connector.init();

    }

  }

} )();

App.init();