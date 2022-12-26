"use strict";
exports.__esModule = true;
/*
 * Notes on how to interpret the code:
 *      Functions starting with an underscore (_) are only called by other functions.
 *      Functions that do not begin with any underscore are called from buttons in the html document, but can also be
 *        called by other functions.
 */
var tiles = [];
var amount_mines = 0;
var first_click_happened = false;
/**
 * false > set flag
 * true  > reveal tile
 */
var click_mode = false;
var amount_flags = 0;
//
// - misc
//
/**
 * Clears the field in the html document and overwrites `tiles` with an empty array, resets most of the global
 * variables (NOT: `click_mode` and `amount_mines`) and calls `_init_flags`.
 */
function _clear_field() {
    tiles = [];
    first_click_happened = false;
    amount_flags = 0;
    _init_flags();
    var field = document.getElementById("field"); // HTMLDivElement
    if (field === null) {
        console.log("Could not retreive the HTMLElement with the id 'field'. This probally happened because this function is called quite often.");
        return;
    }
    field.remove();
}
/**
 * Returns a pseudorandom index from the passed array.
 * You shouldn't pass an empty array.
 * @param  my_array The array from which you want the index.
 * @returns The pseudorandom index.
 */
function _get_random_index(my_array) {
    return Math.floor(Math.random() * my_array.length);
}
/**
 * Returns all the adjecent tiles and their coordinates from a specific tile. Edge cases, like tiles in corners are
 * handeled, meaning that the maximum amount of returned tiles is eight and the minimum is four.
 * @param x The x-coordinate of the tile.
 * @param y The y-coordinate of the tile.
 * @returns A two dimensional array containing the adjacent tiles and their x- and y-coordinates.
 */
function _get_surrounding_tiles(x, y) {
    var x_min = 0;
    var x_max = tiles[0].length - 1;
    var y_min = 0;
    var y_max = tiles.length - 1;
    var options = [
        [y, x - 1, x > x_min],
        [y, x + 1, x < x_max],
        [y - 1, x, y > y_min],
        [y + 1, x, y < y_max],
        [y - 1, x - 1, (y > y_min) && (x > x_min)],
        [y - 1, x + 1, (y > y_min) && (x < x_max)],
        [y + 1, x - 1, (y < y_max) && (x > x_min)],
        [y + 1, x + 1, (y < y_max) && (x < x_max)]
    ];
    var found = [];
    for (var option = 0; option < options.length; option++) {
        if (options[option][2]) {
            var x_ = options[option][1];
            var y_ = options[option][0];
            var tile = tiles[y_][x_];
            found.push([tile, x_, y_]);
        }
    }
    return found;
}
/**
 * When the user reveals an empty tile all other tiles that are connected to it and or either numbers or are also empty
 * are revealed.
 * For this this function calls itself recursively.
 * @param x The x-coordinate of the revealed tile.
 * @param y The y-coordinate of the revealed tile.
 */
function _reveal_empty_tiles(x, y) {
    // Getting the tiles that suuound the passed tile.
    var surrounding_tiles = _get_surrounding_tiles(x, y);
    // Looping through them.
    for (var i = 0; i < surrounding_tiles.length; i++) {
        // extracting the needed information from the two dimensional array `surrounding_tiles`.
        var tile = surrounding_tiles[i][0];
        var x_ = surrounding_tiles[i][1];
        var y_ = surrounding_tiles[i][2];
        // Something only appens, when the adjecent tile wasn't revealed by the user.
        if (tile.className == "tile undiscovered") {
            // If the tile has no content it is empty and this function is called recursively.
            if (tile.textContent == "") {
                tile.className = "tile empty";
                _reveal_empty_tiles(x_, y_);
                // If the tile isn't a mine it is a number and can be revealed.
            }
            else if (tile.textContent != "M") {
                tile.className = "tile number_" + Number(tile.textContent);
            }
        }
    }
}
//
// - for game creation
//
//
// - checking for mines
//
/**
 * Checks if the tile above the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _top_is_mine(x, y) {
    return tiles[y - 1][x].textContent == "M" ? 1 : 0;
}
/**
 * Checks if the tile below the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _bottom_is_mine(x, y) {
    return tiles[y + 1][x].textContent == "M" ? 1 : 0;
}
/**
 * Checks if the tile to the left of the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _left_is_mine(x, y) {
    return tiles[y][x - 1].textContent == "M" ? 1 : 0;
}
/**
 * Checks if the tile to the right of the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _right_is_mine(x, y) {
    return tiles[y][x + 1].textContent == "M" ? 1 : 0;
}
/**
 * Checks if the tile to the top left of the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _top_left_is_mine(x, y) {
    return tiles[y - 1][x - 1].textContent == "M" ? 1 : 0;
}
/**
 * Checks if the tile to the top right of the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _top_right_is_mine(x, y) {
    return tiles[y - 1][x + 1].textContent == "M" ? 1 : 0;
}
/**
 * Checks if the tile to the bottom left of the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _bottom_left_is_mine(x, y) {
    return tiles[y + 1][x - 1].textContent == "M" ? 1 : 0;
}
/**
 * Checks if the tile to the top left of the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _bottom_right_is_mine(x, y) {
    return tiles[y + 1][x + 1].textContent == "M" ? 1 : 0;
}
//
// - for actually creating the game
//
/**
 * Creates the tiles and adds them to the field.
 * @param width The width of the field / how many tiles are created per row.
 * @param height The height of the field / how many tiles are created per column.
 */
function _create_tiles(width, height) {
    var game = document.getElementById("field_container"); // HTMLDivElement
    var field = document.createElement("table");
    if (game === null) {
        console.error("Could not retreive the HTMLElement with the id 'field_container'.");
        return;
    }
    game.appendChild(field);
    field.id = "field";
    var _loop_1 = function (y) {
        var row = document.createElement("tr");
        row.className = "tile_row";
        field.appendChild(row);
        tiles.push([]);
        var _loop_2 = function (x) {
            var tile_td = document.createElement("td");
            row.appendChild(tile_td);
            var tile = document.createElement("button");
            tile_td.appendChild(tile);
            tile.className = "tile undiscovered";
            tile.textContent = "";
            tile.oncontextmenu = function () { return false; };
            tile.onmousedown = function (event) {
                if (event.button == 0) {
                    reveal_tile(x, y);
                }
                else if (event.button == 2) {
                    var click_mode_backup = click_mode;
                    click_mode = false;
                    reveal_tile(x, y);
                    click_mode = click_mode_backup;
                }
            };
            tiles[y].push(tile);
        };
        for (var x = 0; x < width; x++) {
            _loop_2(x);
        }
    };
    for (var y = 0; y < height; y++) {
        _loop_1(y);
    }
}
/**
 * Sets the mines at pseudo random positions on the field. Certain tiles can be assigned to be left untouched.
 * @param exclude The tiles that are not supposed to become mines.
 */
function _set_mines(exclude) {
    var exclude_length = exclude.length;
    var mines = exclude;
    for (var mine = 0; mine < amount_mines; mine++) {
        var temp = tiles[_get_random_index(tiles)];
        var new_mine = temp[_get_random_index(temp)];
        if (mines.includes(new_mine)) {
            mine--;
        }
        else {
            mines.push(new_mine);
        }
    }
    for (var mine = exclude_length; mine < mines.length; mine++) {
        mines[mine].textContent = "M";
    }
}
/**
 * When the user reveals a tile for the first time following things will happen:
 *  > this function will call `_set_mines` using the passed tile and its surrounding tiles
 *  > and `_set_numbers`
 *  > and will set `first_click_happened` so that these points will only affect the game once.
 * @param tile The tile which was clicked and will ultimately not become a mine.
 * @param {number} x The x-coordinate of the tile.
 * @param {number} y The y-coordinate of the tile.
 */
function _first_click(tile, x, y) {
    if (!first_click_happened) {
        first_click_happened = true;
        var surrounding_tiles = _get_surrounding_tiles(x, y);
        var surrounding_tiles2 = [tile];
        for (var i = 0; i < surrounding_tiles.length; i++) {
            surrounding_tiles2.push(surrounding_tiles[i][0]);
        }
        _set_mines(surrounding_tiles2);
        _set_numbers();
        _init_flags();
    }
}
/**
 * Goes through the whole field, after the mines have been placed, and assigns the appropriate numbers to the tiles or,
 * if no mines are adjecent, leaves them blank (.textContent = ""). Mines are left intact.
 */
function _set_numbers() {
    // top left
    if (tiles[0][0].textContent != "M") {
        var surrounding = String(_bottom_is_mine(0, 0) + _right_is_mine(0, 0) + _bottom_right_is_mine(0, 0));
        tiles[0][0].textContent = surrounding == "0" ? "" : surrounding;
    }
    // top right
    var x = tiles[0].length - 1;
    if (tiles[0][x].textContent != "M") {
        var surrounding = String(_bottom_is_mine(x, 0) + _left_is_mine(x, 0) + _bottom_left_is_mine(x, 0));
        tiles[0][x].textContent = surrounding == "0" ? "" : surrounding;
    }
    // bottom left
    var y = tiles.length - 1;
    if (tiles[y][0].textContent != "M") {
        var surrounding = String(_top_is_mine(0, y) + _right_is_mine(0, y) + _top_right_is_mine(0, y));
        tiles[y][0].textContent = surrounding == "0" ? "" : surrounding;
    }
    // bottom right
    if (tiles[y][x].textContent != "M") {
        var surrounding = String(_top_is_mine(x, y) + _left_is_mine(x, y) + _top_left_is_mine(x, y));
        tiles[y][x].textContent = surrounding == "0" ? "" : surrounding;
    }
    // first row, excluding first and last
    for (var x_1 = 1; x_1 < tiles[0].length - 1; x_1++) {
        if (tiles[0][x_1].textContent != "M") {
            var surrounding = String(_bottom_is_mine(x_1, 0) + _left_is_mine(x_1, 0) + _right_is_mine(x_1, 0) +
                _bottom_left_is_mine(x_1, 0) + _bottom_right_is_mine(x_1, 0));
            tiles[0][x_1].textContent = surrounding == "0" ? "" : surrounding;
        }
    }
    // last row, excluding first and last
    for (var x_2 = 1; x_2 < tiles[0].length - 1; x_2++) {
        var y_1 = tiles.length - 1;
        if (tiles[y_1][x_2].textContent != "M") {
            var surrounding = String(_top_is_mine(x_2, y_1) + _left_is_mine(x_2, y_1) + _right_is_mine(x_2, y_1) + _top_left_is_mine(x_2, y_1)
                + _top_right_is_mine(x_2, y_1));
            tiles[y_1][x_2].textContent = surrounding == "0" ? "" : surrounding;
        }
    }
    // first column, excluding top and bottom
    for (var y_2 = 1; y_2 < tiles.length - 1; y_2++) {
        if (tiles[y_2][0].textContent != "M") {
            var surrounding = String(_top_is_mine(0, y_2) + _bottom_is_mine(0, y_2) + _right_is_mine(0, y_2) +
                _top_right_is_mine(0, y_2) + _bottom_right_is_mine(0, y_2));
            tiles[y_2][0].textContent = surrounding == "0" ? "" : surrounding;
        }
    }
    // last column, excluding top and bottom
    for (var y_3 = 1; y_3 < tiles.length - 1; y_3++) {
        var x_3 = tiles[y_3].length - 1;
        if (tiles[y_3][x_3].textContent != "M") {
            var surrounding = String(_top_is_mine(x_3, y_3) + _bottom_is_mine(x_3, y_3) + _left_is_mine(x_3, y_3) +
                _top_left_is_mine(x_3, y_3) + _bottom_left_is_mine(x_3, y_3));
            tiles[y_3][x_3].textContent = surrounding == "0" ? "" : surrounding;
        }
    }
    // the remaining tiles
    for (var y_4 = 1; y_4 < tiles.length - 1; y_4++) {
        for (var x_4 = 1; x_4 < tiles[y_4].length - 1; x_4++) {
            if (tiles[y_4][x_4].textContent != "M") {
                var surrounding = String(_top_is_mine(x_4, y_4) + _bottom_is_mine(x_4, y_4) + _right_is_mine(x_4, y_4) + _left_is_mine(x_4, y_4)
                    + _top_left_is_mine(x_4, y_4) + _top_right_is_mine(x_4, y_4) + _bottom_left_is_mine(x_4, y_4) +
                    _bottom_right_is_mine(x_4, y_4));
                tiles[y_4][x_4].textContent = surrounding == "0" ? "" : surrounding;
            }
        }
    }
}
//
// - ui for the amount of placed flags
//
function _init_flags() {
    var flag_count = document.getElementById("flag_count");
    if (flag_count === null) {
        console.error("Could not retreive the HTMLElement with the id 'flag_count'.");
        return;
    }
    flag_count.textContent = "0/" + String(amount_mines) + " mines";
    var flags_error = document.getElementById("error_to_many_flags");
    if (flags_error === null) {
        console.error("Could not retreive the HTMLElement with the id 'error_to_many_flags'.");
        return;
    }
    flags_error.hidden = true;
}
function _add_flag() {
    var flag_count = document.getElementById("flag_count");
    if (flag_count === null) {
        console.error("Could not retreive the HTMLElement with the id 'flag_count'.");
        return;
    }
    amount_flags++;
    flag_count.textContent = String(amount_flags) + "/" + String(amount_mines) + " mines";
    if (amount_flags > amount_mines) {
        var flags_error = document.getElementById("error_to_many_flags");
        if (flags_error === null) {
            console.error("Could not retreive the HTMLElement with the id 'error_to_many_flags'.");
            return;
        }
        flags_error.hidden = false;
    }
}
function _remove_flag() {
    var flag_count = document.getElementById("flag_count");
    if (flag_count === null) {
        console.error("Could not retreive the HTMLElement with the id 'flag_count'.");
        return;
    }
    amount_flags--;
    flag_count.textContent = String(amount_flags) + "/" + String(amount_mines) + " mines";
    if (amount_flags < amount_mines) {
        var flags_error = document.getElementById("error_to_many_flags");
        if (flags_error === null) {
            console.error("Could not retreive the HTMLElement with the id 'error_to_many_flags'.");
            return;
        }
        flags_error.hidden = true;
    }
}
//
// - toggeling the visability of the game setup, game and the score board
//
/**
 * Toggles the hidden attribute for the game setup.
 * @param vis If it should be visible (true) or hidden (false).
 */
function _set_game_setup_visability(vis) {
    var x = document.getElementById("game_setup");
    if (x === null) {
        console.error("Could not retreive the HTMLElement with the id 'game_setup'.");
        return;
    }
    x.hidden = !vis;
}
/**
 * Toggles the hidden attribute for the game.
 * @param vis If it should be visible (true) or hidden (false).
 */
function _set_tile_visability(vis) {
    var x = document.getElementById("game");
    if (x === null) {
        console.error("Could not retreive the HTMLElement with the id 'game'.");
        return;
    }
    x.hidden = !vis;
}
/**
 * Toggles the hidden attribute for the scores overview.
 * @param vis If it should be visible (true) or hidden (false).
 */
function _set_scores_visability(vis) {
    var x = document.getElementById("scores");
    if (x === null) {
        console.error("Could not retreive the HTMLElement with the id 'scores'.");
        return;
    }
    x.hidden = !vis;
}
//
// - called from html document
//
/**
 * Handels what happens, when a tile is clicked.
 * @param x The tiles x-coordinate.
 * @param y The tiles y-coordinate.
 */
function reveal_tile(x, y) {
    var tile = tiles[y][x];
    _first_click(tile, x, y);
    var content = tile.textContent;
    var tile_class = tile.className;
    // reveal tile
    if (click_mode) {
        // nothing happens when there is a flag or questionmark on the tile 
        if (tile_class == "tile undiscovered") {
            // if the tile is a mine
            if (content == "M") {
                var img = document.createElement("img");
                img.src = "assets/160x160/mine.png";
                img.className = "flag_img";
                tile.appendChild(img);
                tile.className = "tile mine";
                // if the tile is empty
            }
            else if (content == "") {
                tile.className = "tile empty";
                _reveal_empty_tiles(x, y);
                // if the tile is a number
            }
            else {
                tile.className = "tile number_" + content;
            }
            // if a tle with a number is clicked and there are enough flags and no questionmarks surrounding it, the tiles
            // surrounding tiles are revealed
        }
        else if (tile_class.startsWith("tile number_")) {
            var num = Number(tile_class.charAt(tile_class.length - 1));
            var flags = 0;
            var surrounding_tiles = _get_surrounding_tiles(x, y);
            for (var i = 0; i < surrounding_tiles.length; i++) {
                if (surrounding_tiles[i][0].className == "tile flag") {
                    flags++;
                }
                else if (surrounding_tiles[i][0].className == "tile questionmark") {
                    return;
                }
            }
            if (flags == num) {
                var click_mode_backup = click_mode;
                click_mode = true;
                for (var i = 0; i < surrounding_tiles.length; i++) {
                    if (surrounding_tiles[i][0].className == "tile undiscovered") {
                        reveal_tile(surrounding_tiles[i][1], surrounding_tiles[i][2]);
                    }
                }
                click_mode = click_mode_backup;
            }
        }
        // set flag
    }
    else {
        // undiscovered -> flag
        if (tile_class == "tile undiscovered") {
            var img = document.createElement("img");
            img.src = "assets/160x160/flag.png";
            img.className = "flag_img";
            tile.appendChild(img);
            tile.className = "tile flag";
            _add_flag();
            // flag -> questionmark 
        }
        else if (tile_class == "tile flag") {
            tile.children[0].remove();
            var img = document.createElement("img");
            img.src = "assets/160x160/questionmark.png";
            img.className = "flag_img";
            tile.appendChild(img);
            tile.className = "tile questionmark";
            _remove_flag();
            // questionmark -> undiscovered
        }
        else if (tile_class == "tile questionmark") {
            tile.children[0].remove();
            tile.className = "tile undiscovered";
        }
    }
}
/**
 * Handels the creation of the field, hides the creation menu and unhides the game.
 * @param width The width of the field / how many tiles are created per row.
 * @param height The height of the field / how many tiles are created per column.
 * @param amount The amount of mines that are to be created.
 */
function create_field(width, height, amount) {
    amount_mines = amount;
    _set_game_setup_visability(false);
    _clear_field();
    _create_tiles(width, height);
    _set_tile_visability(true);
}
/**
 * Applys the custom input for a new game.
 */
function custom_setup() {
    _set_game_setup_visability(false);
    _clear_field();
    var x = document.getElementById("custom_width");
    if (x === null) {
        console.error("Could not retreive the HTMLElement with the id 'custom_width'.");
        return;
    }
    var width = Number(x.value);
    x = document.getElementById("custom_height");
    if (x === null) {
        console.error("Could not retreive the HTMLElement with the id 'custom_height'.");
        return;
    }
    var height = Number(x.value);
    x = document.getElementById("custom_amount_mines");
    if (x === null) {
        console.error("Could not retreive the HTMLElement with the id 'custom_amount_mines'.");
        return;
    }
    var amount = Number(x.value);
    if (amount + 1 > width * height) {
        // ERROR
        console.error("TO MANY MINES!!!");
        _set_game_setup_visability(true);
        return;
    }
    amount_mines = amount;
    _create_tiles(width, height);
    _set_tile_visability(true);
    toggle_custom_input(true);
}
/**
 * Toggles, if the input fields and the button for creating a custom game are visible or not.
 * @param input_visible If the input fields and button for the custom creation should be visible (true) or not (false).
 */
function toggle_custom_input(input_visible) {
    var custom_interface = document.getElementById("custom_interface");
    var button = document.getElementById("custom_button");
    if (custom_interface === null) {
        console.error("Could not retreive the HTMLElement with the id 'custom_interface'.");
        return;
    }
    if (button === null) {
        console.error("Could not retreive the HTMLElement with the id 'custom_button'.");
        return;
    }
    custom_interface.hidden = !input_visible;
    button.hidden = input_visible;
}
/**
 * Return to the game setup and removes all the tiles.
 */
function back_button() {
    _set_tile_visability(false);
    _clear_field();
    _set_game_setup_visability(true);
}
function toggle_click_mode() {
    var button = document.getElementById("game_click_mode_button");
    var label = document.getElementById("game_click_mode_label");
    if (button === null) {
        console.error("Could not retreive the HTMLElement with the id 'game_click_mode_button'.");
        return;
    }
    if (label === null) {
        console.error("Could not retreive the HTMLElement with the id 'game_click_mode_label'.");
        return;
    }
    click_mode = !click_mode;
    var text_1 = "set flag";
    var text_2 = "reveal tile";
    if (click_mode) {
        button.textContent = text_2;
        label.textContent = text_1;
    }
    else {
        button.textContent = text_1;
        label.textContent = text_2;
    }
}
