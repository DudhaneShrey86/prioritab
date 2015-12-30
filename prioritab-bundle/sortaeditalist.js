// An editable, sortable list
// http://web.koesbong.com/2011/01/24/sortable-and-editable-to-do-list-using-html5s-localstorage/

$(function() {
    var il, im, ir,
        listCounters = ['todo-counter-left', 'todo-counter-mid', 'todo-counter-right'],
        j = 0,
        k,
        $formLeft = $('#todo-form-left'),
        $formMid = $('#todo-form-mid'),
        $formRight = $('#todo-form-right'),
        $removeLink = $('#shown-items-left li a'),
        $itemListLeft = $('#shown-items-left'),
        $itemListMid = $('#shown-items-mid'),
        $itemListRight = $('#shown-items-right'),
        $editable = $('.editable'),
        $clearAll = $('.clear-all-link'),
        $newTodo = $('.todo'),
        order = [],
        orderList;

    chrome.storage.sync.get(listCounters, function(result) {
        il = (result['todo-counter-left']) ? result['todo-counter-left'] + 1 : 1;
        im = (result['todo-counter-mid']) ? result['todo-counter-mid'] + 1 : 1;
        ir = (result['todo-counter-right']) ? result['todo-counter-right'] + 1 : 1;
    });

    // Load todo list keys
    chrome.storage.sync.get('todo-orders', function(retrieved) {
        orderList = retrieved['todo-orders'];
        orderList = orderList ? orderList.split(',') : [];

        // Sort todo list keys into their component lists
        var orderListLeft = [],
            orderListMid = [],
            orderListRight = [];
        for (ll = 0; ll < orderList.length; ll++) {
            if (orderList[ll].indexOf('left') >= 0) {
                orderListLeft.push(orderList[ll]);
            }
            else if (orderList[ll].indexOf('mid') >= 0) {
                orderListMid.push(orderList[ll]);
            }
            else if (orderList[ll].indexOf('right') >= 0) {
                orderListRight.push(orderList[ll]);
            }
        }

        // Render existing todo items into the three separate lists
        chrome.storage.sync.get(orderListLeft, function(result) {
            orderListLeft.forEach(function(key){
                $('#shown-items-left').append("<li class='todo-card' id='" + key + "'><span class='todo-text'>" + result[key] + "</span>&nbsp;&nbsp;&nbsp;<span class='pull-right'><a href='#' class='shadow-color'>X</a></span></li>");
            });
            $('li a').fadeOut();
        });

        chrome.storage.sync.get(orderListMid, function(result) {
            orderListMid.forEach(function(key){
                $('#shown-items-mid').append("<li class='todo-card' id='" + key + "'><span class='todo-text'>" + result[key] + "</span>&nbsp;&nbsp;&nbsp;<span class='pull-right'><a href='#' class='shadow-color'>X</a></span></li>");
            });
            $('li a').fadeOut();
        });

        chrome.storage.sync.get(orderListRight, function(result) {
            orderListRight.forEach(function(key){
                $('#shown-items-right').append("<li class='todo-card' id='" + key + "'><span class='todo-text'>" + result[key] + "</span>&nbsp;&nbsp;&nbsp;<span class='pull-right'><a href='#' class='shadow-color'>X</a></span></li>");
            });
            $('li a').fadeOut();
            // ScrollMessage();
        });

        chrome.storage.sync.get('user-shadow-color', function(result) {
            $('.shadow-color').css('color', (result['user-shadow-color']) ? result['user-shadow-color'] : 'grey');
        });

    });

    // Add todo
    $formLeft.submit(function(e) {
        e.preventDefault();
        $.publish('/add/', []);
    });

    $formMid.submit(function(e) {
        e.preventDefault();
        $.publish('/add/', []);
    });

    $formRight.submit(function(e) {
        e.preventDefault();
        $.publish('/add/', []);
    });

    // Remove todo
    $itemListLeft.delegate('a', 'click', function(e) {
        var $this = $(this);
        e.preventDefault();
        $.publish('/remove/', [$this]);
    });

    $itemListMid.delegate('a', 'click', function(e) {
        var $this = $(this);
        e.preventDefault();
        $.publish('/remove/', [$this]);
    });

    $itemListRight.delegate('a', 'click', function(e) {
        var $this = $(this);

        e.preventDefault();
        $.publish('/remove/', [$this]);
    });

    // Sort todo
    $itemListLeft.sortable({
        revert: true,
        connectWith: ['#shown-items-mid, #shown-items-right'],
        stop: function() {
            $.publish('/regenerate-list/', []);
        }
    });

    $itemListMid.sortable({
        revert: true,
        connectWith: ['#shown-items-left, #shown-items-right'],
        stop: function() {
            $.publish('/regenerate-list/', []);
        }
    });

    $itemListRight.sortable({
        revert: true,
        connectWith: ['#shown-items-left, #shown-items-mid'],
        stop: function() {
            $.publish('/regenerate-list/', []);
        }
    });

    // Edit and save todo
    $(".todo-text").inlineEdit({
        buttons: '',
        cancelOnBlur: true,
        save: function(e, data) {
                var newTodoID = $(this).parent().attr('id'),
                    objToSave = {};
                objToSave[newTodoID] = data.value;
                chrome.storage.sync.set(objToSave);
            }
    });

    // Clear all
    $clearAll.click(function(e) {
        e.preventDefault();
        var listToImpact = e.originalEvent.srcElement.getAttribute('data-list');
        $.publish('/clear-all/', [listToImpact]);
    });

    // Fade In and Fade Out the Remove link on hover
    $itemListLeft.delegate('li', 'mouseover mouseout', function(event) {
        var $this = $(this).find('a');

        if (event.type === 'mouseover') {
            $this.stop(true, true).fadeIn();
        } else {
            $this.stop(true, true).fadeOut();
        }
    });

    $itemListMid.delegate('li', 'mouseover mouseout', function(event) {
        var $this = $(this).find('a');

        if(event.type === 'mouseover') {
            $this.stop(true, true).fadeIn();
        } else {
            $this.stop(true, true).fadeOut();
        }
    });

    $itemListRight.delegate('li', 'mouseover mouseout', function(event) {
        var $this = $(this).find('a');

        if(event.type === 'mouseover') {
            $this.stop(true, true).fadeIn();
        } else {
            $this.stop(true, true).fadeOut();
        }
    });

    // Subscribes
    $.subscribe('/add/', function() {
        var todoToAdd = null;
        for (ind = 0; ind < $newTodo.length; ind++) {
            var todoBox = $newTodo[ind];
            if (todoBox.value !== "") {
                todoToAdd = $newTodo[ind];
            }
        }
        if (todoToAdd) {

            // Figure out which list it's in
            var listID = todoToAdd.getAttribute('data-list'),
                listToImpact,
                listCounter;

            switch (listID) {
                case 'left':
                    listToImpact = $itemListLeft;
                    listCounter = il;
                    break;
                case 'mid':
                    listToImpact = $itemListMid;
                    listCounter = im;
                    break;
                case 'right':
                    listToImpact = $itemListRight;
                    listCounter = ir;
                    break;
            }

            // Take the value of the input field and save it to localStorage
            var newTodoID = "todo-" + listID + '-' + listCounter;

            var objToSave = {};
            objToSave[newTodoID] = todoToAdd.value;
            chrome.storage.sync.set(objToSave);

            // Set the to-do max counter so on page refresh it keeps going up instead of reset
            var counterToSave = {},
                counterKey = "todo-counter-" + listID;
            counterToSave[counterKey] = listCounter;
            chrome.storage.sync.set(counterToSave);

            // Append a new list item with the value of the new todo list
            chrome.storage.sync.get(newTodoID, function(result) {
                listToImpact.append("<li class='todo-card' id='" + newTodoID + "'><span class='todo-text'>" + result[newTodoID] + "</span>&nbsp;&nbsp;&nbsp;<span class='pull-right'><a href='#' class='shadow-color'>X</a></span></li>");
                chrome.storage.sync.get('user-shadow-color', function(result) {
                    $('.shadow-color').css('color', (result['user-shadow-color']) ? result['user-shadow-color'] : 'grey');
                });
                $('li a:visible').fadeOut();

                $.publish('/regenerate-list/', []);
            });

            // Hide the new list, then fade it in for effects
            $("#todo-" + listID + '-' + listCounter).css('display', 'none').fadeIn();

            // Empty the input field
            todoToAdd.value = "";

            switch (listID) {
                case 'left':
                    il++;
                    chrome.storage.sync.set({'todo-counter-left': il});
                    break;
                case 'mid':
                    im++;
                    chrome.storage.sync.set({'todo-counter-mid': im});
                    break;
                case 'right':
                    ir++;
                    chrome.storage.sync.set({'todo-counter-right': ir});
                    break;
            }
            // ScrollMessage();
        }
    });

    $.subscribe('/remove/', function($this) {
        var parentId = $this.parent().parent().attr('id');

        // Remove todo list from localStorage based on the id of the clicked parent element
        chrome.storage.sync.remove(parentId);

        // Fade out the list item then remove from DOM
        $this.parent().fadeOut(function() {
            $this.parent().parent().remove();

            $.publish('/regenerate-list/', []);
        });

        // ScrollMessage();
    });

    var reassignToList = function (inputDict) {
        var target = inputDict['target'],
            items = inputDict['items'];

        switch (target) {
            case 'left':
                listCounter = il;
                break;
            case 'mid':
                listCounter = im;
                break;
            case 'right':
                listCounter = ir;
                break;
        }

        items.each(function() {
            if (this.id.indexOf(target) < 0) {
                // Reassign ID
                var oldID = this.id,
                    oldValue;
                newID = "todo-" + target + "-" + listCounter;
                this.id = newID;

                switch (target) {
                    case 'left':
                        il++;
                        chrome.storage.sync.set({'todo-counter-left': il});
                        break;
                    case 'mid':
                        im++;
                        chrome.storage.sync.set({'todo-counter-mid': im});
                        break;
                    case 'right':
                        ir++;
                        chrome.storage.sync.set({'todo-counter-right': ir});
                        break;
                }

                // Store todo item under new key
                chrome.storage.sync.get(oldID, function(retrieved) {
                    oldValue = retrieved[oldID];
                    var objToSave = {};
                    objToSave[newID] = oldValue;
                    chrome.storage.sync.set(objToSave);
                });

            }
        });
        // ScrollMessage();
    };

    $.subscribe('/regenerate-list/', function() {
        var $todoItemsLeft = $('#shown-items-left li'),
            $todoItemsMid = $('#shown-items-mid li');
            $todoItemsRight = $('#shown-items-right li');


        // Make sure all items in the respective lists have the right 'tag'
        // (in event of cross-list movement)
        reassignToList({'target': 'left', 'items': $todoItemsLeft});
        reassignToList({'target': 'mid', 'items': $todoItemsMid});
        reassignToList({'target': 'right', 'items': $todoItemsRight});

        // Empty the order array
        order.length = 0;

        // Go through the list item, grab the ID then push into the array
        $todoItemsLeft.each(function() {
            var id = $(this).attr('id');
            order.push(id);
        });

        $todoItemsMid.each(function() {
            var id = $(this).attr('id');
            order.push(id);
        });

        $todoItemsRight.each(function() {
            var id = $(this).attr('id');
            order.push(id);
        });

        // Convert the array into string and save to localStorage
        chrome.storage.sync.set({'todo-orders': order.join(',')});
    });

    $.subscribe('/clear-all/', function(listToImpactName) {
        var $todoListLi = $('#shown-items-left li'),
            listToImpact;

        switch (listToImpactName) {
            case 'left':
                listToImpact = $('#shown-items-left li');
                break;
            case 'mid':
                listToImpact = $('#shown-items-mid li');
                break;
            case 'right':
                listToImpact = $('#shown-items-right li');
                break;
        }

        chrome.storage.sync.get('todo-orders', function(retrieved){
            var orderList = retrieved['todo-orders'] ? retrieved['todo-orders'].split(',') : [];
            var newOrderList = [];
            for (ind = 0; ind < orderList.length; ind++) {
                if (orderList[ind].indexOf(listToImpactName) < 0) {
                    newOrderList.push(orderList[ind]);
                } else {
                    chrome.storage.sync.remove(orderList[ind]);
                }
            }
            chrome.storage.sync.set({'todo-orders': newOrderList.join(',')});
            listToImpact.remove();
            // ScrollMessage();
        });

    });
});
