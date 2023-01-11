export {}; // Stops functions and stuff from being marked as duplicate implementations.

/*
 * Notes on how to interpret the code:
 *      Functions starting with an underscore (_) are only called by other functions.
 *      Functions that do not begin with any underscore are called from buttons in the html document, but can also be 
 *        called by other functions.
 */

let tiles: HTMLButtonElement[][] = [];

let amount_mines: number = 0;
let amount_flags: number = 0;
let discovered_tiles: number = 0;

let first_click_happened:boolean = false;
/**
 * true  > set flag
 * false > reveal tile
 */
let click_mode: boolean = false;
let game_over: boolean = false;

/**
 * Data structure:
 *  Size: <width>x<height>
 *  localstorage:
 *  (No trailing "|")
 *  
 *  ------------------b64------------------ ...
 *  -------b64------- | -------b64------- | ...
 *  <username>|<time>   <username>|<time>   ...
 */
class LeaderboardSize {

    /** How many mines the field has. */
    private AMOUNT_MINES: number;
    /** The width of the field. */
    private WIDTH: number;
    /** The height of the field. */
    private HEIGHT: number;
    /**
     * The width and height as a combined string:  
     * `width`x`height`
     */
    private SIZE: string;
    /** The maximum amount of users that are saved in local storage. */
    private AMOUNT_USERS: number;

    /** 
     * The key for the local storage value.  
     * It has following structure:  
     * LEADERBOARD_SIZE_ `width` _ `height` _ `amount_mines`
     */
    private LS_KEY: string;
    /** The character with which the local storage value is seperated into smaller ones. */
    private LS_CONTENT_DIVIDER: string;

    /** The html table element for displaying the leaderboard. The id of the element will be equal to "this.LS_KEY". */
    private HTML_TABLE: HTMLTableElement;
    /** The html div element in which the `this.HTML_TABLE` element is contained. */
    private TABLE_CONTAINER: HTMLDivElement;

    /** The html select element for deciding which leaderboard to show to the user. */
    private SELECT_ELEMENT: HTMLSelectElement;

    /**
     * The text the option displays for selecting this leaderboard:  
     * `this.SIZE` [space] `this.AMOUNT_MINES`
     */
    private OPTION_TEXT: string;

    /**
     * The leaderboard as a two dimensional array:
     * 1. The username
     * 2. The time in ms the user took to complete the game
     * 3. The time in a nice, formatted style for presenting to the user
     */
    private leaders: [string, number, string][];

    public constructor(amount_mines: number, width: number, height: number, table_container_element: HTMLDivElement,
        select_element: HTMLSelectElement,
        ls_content_divider: string = "|", amount_users: number = 10) {

        this.AMOUNT_MINES = amount_mines;
        this.WIDTH = width;
        this.HEIGHT = height;
        this.SIZE = String(width) + "x" + String(height);
        this.AMOUNT_USERS = amount_users;

        this.LS_KEY = "LEADERBOARD_SIZE_" + String(width) + "_" + String(height) + "_" + String(amount_mines);
        this.LS_CONTENT_DIVIDER = ls_content_divider;

        this.leaders = [];

        this.TABLE_CONTAINER = table_container_element;

        this.SELECT_ELEMENT = select_element;

        this.OPTION_TEXT = this.SIZE + " " + String(amount_mines);

        this.get_from_localstorage();
        this.create_ui();
        this.add_option();
    }

    /**
     * Loads the saved data from local storage. If no data is already saved a new entry is created.
     */
    private get_from_localstorage(): void {
        // Get the data saved in local storage.
        let ls_data = localStorage.getItem(this.LS_KEY);

        // If no data was retreived a new entry is created.
        if (ls_data === null) {
            console.info("Could not reteive value from localstorage key " + this.LS_KEY + " creating it now.");
            localStorage.setItem(this.LS_KEY, "");
            return;
        }

        // b64 decode the retreived data.
        ls_data = atob(ls_data);

        // If decoding failed.
        if (ls_data === null) {
            console.error("Could not b64 decode local storage value from key " + this.LS_KEY + ".");
            return;
        }

        // Get the b64 encoded data parts for each leaderboard entry.
        let user_data: string[] = ls_data.split(this.LS_CONTENT_DIVIDER);

        // Decode each entry and add it to "this.leaders".
        for (let user: number = 0; user < user_data.length; user++) {
            let data: string = user_data[user];
            // b64 decode the data part.
            data = atob(data);

            // If decoding failed.
            if (data === null) {
                console.error("Could not decode user data from local storage value from key " + this.LS_KEY + ".");
                continue;
            }

            // Split the decoded parts into the username and the amount of time it took the user to complete the game.
            let data_parts = data.split(this.LS_CONTENT_DIVIDER) as [string, string];

            // If the aquired data cannot be spilt into the two needed parts.
            if (data_parts.length != 2) {
                console.error("Could not decode user data from local storage value from key " + this.LS_KEY + " into enough parts (got: " + String(data_parts.length) + " expected: 2).");
                continue;
            }

            // Convert the time from string to number.
            let time: number = parseInt(data_parts[1]);

            this.leaders.push([data_parts[0], time, _convert_time_to_string(time)]);
        }
    }

    /**
     * Creates a new html table element and adds all the highscores to it. The table is then appended to
     * "this.TABLE_CONTAINER".
     */
    private create_ui(): void {
        // Create the tbale element.
        this.HTML_TABLE = document.createElement("table") as HTMLTableElement;
        this.HTML_TABLE.id = this.LS_KEY;
        this.HTML_TABLE.hidden = true;

        // Add each score to the table element.
        for (let user: number = 0; user < this.leaders.length; user++) {
            // Create a new row for the score.
            let tr: HTMLTableRowElement = document.createElement("tr") as HTMLTableRowElement;
            this.HTML_TABLE.appendChild(tr);

            // Create a cell for the username.
            let td: HTMLTableCellElement = document.createElement("td") as HTMLTableCellElement;
            td.textContent = this.leaders[user][0];
            tr.appendChild(td);

            // Create a cell for the score.
            td = document.createElement("td");
            td.textContent = String(this.leaders[user][2]);
            tr.appendChild(td);
        }

        // If the table container wasn't found when this object was initialized.
        if (this.TABLE_CONTAINER === null) {
            console.error("Could not add the highscore table to the table container. The table container wasn't be retreived ehen this object was initialized.");
            return;
        }

        this.TABLE_CONTAINER.appendChild(this.HTML_TABLE);
    }

    /**
     * Adds the option for displaying this leaderboard to the user to the select element.
     */
    private add_option(): void {
        let option: HTMLOptionElement = document.createElement("option");
        option.textContent = this.OPTION_TEXT;
        // option.value = this.OPTION_VALUE;

        this.SELECT_ELEMENT.appendChild(option);
    }

    

    private set_to_localstorage(): void {
        let value: string = "";

        for (let user: number = 0; user < this.leaders.length; user++) {
            value = value + btoa(this.leaders[user][0] + "|" + String(this.leaders[user][1])) + "|"
        }

        value = value.substring(0, value.length - 1);
        value = btoa(value);

        localStorage.setItem(this.LS_KEY, value);
    }

    

    private reload_ui() {
        this.HTML_TABLE.remove();
        this.create_ui();
    }

    /**
     * Adds a new score to the leaderboard. If the score is to low and the leaderboard to full it won't be added. Saves
     * the leaderboard to local storage and resets the table for displaying this leaderboard.
     * @param username The username. Duh.
     * @param time The time in ms it took the user to complete the game.
     * @param display_time The time ot took the user to ccomplete the game but formatted nicely for presenting to them.
     */
    public add_user(username: string, time: number, display_time: string): void {
        let added_user: boolean = false;
        // Goes through the existing leaderboard and checks if the users time is better than the one of another one. If
        // it isn't and the leaderboard is full the user isn't added to it.
        for (let user: number = 0; user < this.leaders.length; user++) {
            if (time < this.leaders[user][1]) {
                // insterts after the index user
                this.leaders.splice(user, 0, [username, time, display_time]);
                added_user = true;
                break;
            }
        }

        //////////////////////////////////////////////////////////////////

        // If there are no other users.
        if (this.leaders.length == 0) {
            this.leaders.push([username, time, display_time]);
        } else if (!added_user) {
            this.leaders.splice(this.leaders.length, 0, [username, time, display_time]);
        }

        if (this.leaders.length > this.AMOUNT_USERS) {
            this.leaders.pop();
        }

        this.set_to_localstorage();
        this.reload_ui();
    }

    /**
     * Hides this leaderboard from the user.
     */
    public hide(): void {
        this.HTML_TABLE.hidden = true;
    }

    /**
     * Shows this leaderboard to the user.
     */
    public show(): void {
        this.HTML_TABLE.hidden = false;
    }
}

/**
 * Data:
 * (Has trailing "|")
 *  
 *  -------------------b64------------------- | -------------------b64------------------- | ... |
 *  <size_width>x<size_height>|<amount_mines> | <size_width>x<size_height>|<amount_mines> | ... |
 */
class LeaderboardHandler {

    private LS_KEY: string;
    private LS_CONTENT_DIVIDER: string;
    private UI_SELECT_ID: string;
    private LEADERBOARD_ID: string;

    private leader_boards: Map<string, LeaderboardSize>;
    private last_leaderboard_shown: string|null;

    public constructor() {
        this.LS_KEY = "LEADERBOARD";
        this.LS_CONTENT_DIVIDER = "|";
        this.UI_SELECT_ID = "LEADERBOARD_SIZE_MINE_SELECT";
        this.LEADERBOARD_ID = "leaderboard";

        this.leader_boards = new Map();
        this.last_leaderboard_shown = null;

        this.get_from_localstorage();
    }

    private get_from_localstorage(): void {
        let ls_data = localStorage.getItem(this.LS_KEY);

        if (ls_data === null) {
            console.info("Could not retreive contents from local storage key: " + this.LS_KEY + " creating it now.");
            localStorage.setItem(this.LS_KEY, "");
            return;
        }

        let b64_data: string[] = ls_data.split(this.LS_CONTENT_DIVIDER);

        for (let data: number = 0; data < b64_data.length - 1; data++) {
            let decoded_data = atob(b64_data[data]);
            let parts = decoded_data.split(this.LS_CONTENT_DIVIDER);

            if (parts.length != 2) {
                console.error("Could not successfully split data from localstorage key " + this.LS_KEY + " (got: " + parts.length + " expected: 2).");
                continue;
            }

            this.leader_boards.set(
                decoded_data,
                new LeaderboardSize(
                    parts[0],
                    Number(parts[1]),
                    this.UI_SELECT_ID,
                    this.LS_CONTENT_DIVIDER
                )
            );
        }
    }

    private set_to_localstorage(): void {
        let set_to = "";
        let keys = this.leader_boards.keys();

        while (true) {
            let stuff = keys.next() as IteratorResult<string>;
            let done = stuff.done;

            if ((done) || (done === undefined)) {
                break;
            }

            set_to = set_to + btoa(stuff.value) + "|";
        }

        localStorage.setItem(this.LS_KEY, set_to);
    }

    public add_user(user_name: string, time: number, size: string, amount: number, display_time: string): void {
        let dict_key: string = size + this.LS_CONTENT_DIVIDER + amount;
        let dict_element = this.leader_boards.get(dict_key);

        if (dict_element === undefined) {
            dict_element = new LeaderboardSize(size, amount, this.UI_SELECT_ID, this.LS_CONTENT_DIVIDER);
            this.leader_boards.set(dict_key, dict_element);
        }

        dict_element.add_user(user_name, time, display_time);

        this.set_to_localstorage();
    }

    public select_leaderboard_to_show(): void {
        let selection_element = document.getElementById(this.UI_SELECT_ID) as HTMLSelectElement;

        if (selection_element === null) {
            console.error("Could not retreive html element with id " + this.UI_SELECT_ID + ".");
            return;
        }

        let option: string = selection_element.value;
        console.log(option);

        console.log(this.leader_boards);

        // hide last one
        if (this.last_leaderboard_shown !== null) {
            let board = this.leader_boards.get(this.last_leaderboard_shown);

            if (board === undefined) {
                console.error("Could not retreive value from key " + this.last_leaderboard_shown + " from map.");
                return;
            }

            board.hide();
        }

        // show next one
        let board = this.leader_boards.get(option);

        if (board === undefined) {
            console.error("Could not retreive value from key " + option + " from map.");
            return;
        }

        board.show();

        this.last_leaderboard_shown = option;
    }

    public hide(): void {
        let board = document.getElementById(this.LEADERBOARD_ID);

        if (board === null) {
            console.error("Could not retreive html element with id " + this.LEADERBOARD_ID + ".");
            return;
        }

        board.hidden = true;
    }

    public show(): void {
        let board = document.getElementById(this.LEADERBOARD_ID);

        if (board === null) {
            console.error("Could not retreive html element with id " + this.LEADERBOARD_ID + ".");
            return;
        }

        board.hidden = false;
    }
}

class Field {

    public constructor() {

    }
}

function _convert_time_to_string(time: number): string {
    let ms: number = Math.floor(time);
    let s: number = Math.floor(ms / 1000);
    let min: number = Math.floor(s / 60);
    let h: number = Math.floor(min / 60);

    ms = ms - s * 1000;
    s = s - min * 60;
    min = min - h * 60;

    let res = "";
    if (h > 0) {
        res = res + String(h) + "h ";
        res = res + String(min) + "min ";
        res = res+ String(s) + "s";
    } else if (min > 0) {
        res = res + String(min) + "min ";
        res = res + String(s) + "s";
    } else if (s > 0) {
        res = res + String(s) + "s";
    }

    return res;
}

class TimeTracker {

    private start_time: Date;
    private end_time: Date;
    private difference_ms: number;
    private difference_display: string;

    public constructor() {

    }

    public start(): void {
        this.start_time = new Date();
    }

    public end(): void {
        this.end_time = new Date();
        this.difference_ms = this.end_time.valueOf() - this.start_time.valueOf();
        this.difference_display = _convert_time_to_string(this.difference_ms);
    }

    public get_difference_ms(): number {
        return this.difference_ms;
    }

    public get_difference_display(): string {
        return this.difference_display;
    }
}

const leaderboard = new LeaderboardHandler();
const time_tracker = new TimeTracker();

//
// - misc
//

/**
 * Clears the field in the html document and overwrites `tiles` with an empty array, resets most of the global
 * letiables (NOT: `click_mode` and `amount_mines`) and calls `_init_flags`, `death_screen_hide` and
 * `victory_screen_hide`.
 */
function _clear_field(): void {
    tiles = [];
    first_click_happened = false;
    amount_flags = 0;
    game_over = false;
    discovered_tiles = 0;

    _init_flags();
    death_screen_hide();
    victory_screen_hide();

    let field = document.getElementById("field"); // HTMLDivElement
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
function _get_random_index(my_array: any[]): number {
    return Math.floor(Math.random() * my_array.length);
}

/**
 * Returns all the adjecent tiles and their coordinates from a specific tile. Edge cases, like tiles in corners are 
 * handeled, meaning that the maximum amount of returned tiles is eight and the minimum is four.
 * @param x The x-coordinate of the tile.
 * @param y The y-coordinate of the tile.
 * @returns A two dimensional array containing the adjacent tiles and their x- and y-coordinates.
 */
function _get_surrounding_tiles(x: number, y: number): [HTMLButtonElement, number, number][] {
    let x_min: number = 0;
    let x_max: number = tiles[0].length - 1;
    let y_min: number = 0;
    let y_max: number = tiles.length - 1;

    let options: [number, number, boolean][] = [
        [y,     x - 1,  x > x_min],
        [y,     x + 1,  x < x_max],
        [y - 1, x,      y > y_min],
        [y + 1, x,      y < y_max],
        [y - 1, x - 1,  (y > y_min) && (x > x_min)],
        [y - 1, x + 1,  (y > y_min) && (x < x_max)],
        [y + 1, x - 1,  (y < y_max) && (x > x_min)],
        [y + 1, x + 1,  (y < y_max) && (x < x_max)]
    ];

    let found: [HTMLButtonElement, number, number][] = [];

    for (let option:number = 0; option < options.length; option++) {
        if (options[option][2]) {
            let x_: number = options[option][1];
            let y_: number = options[option][0];
            let tile = tiles[y_][x_];
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
function _reveal_empty_tiles(x: number, y: number): void {

    // Getting the tiles that suround the passed tile.
    let surrounding_tiles = _get_surrounding_tiles(x, y);

    // Looping through them.
    for (let i: number = 0; i < surrounding_tiles.length; i++) {
        // extracting the needed information from the two dimensional array `surrounding_tiles`.
        let tile: HTMLButtonElement = surrounding_tiles[i][0];
        let x_: number = surrounding_tiles[i][1];
        let y_: number = surrounding_tiles[i][2]
        
        // Something only happens, when the adjecent tile wasn't revealed by the user.
        if (tile.className == "tile undiscovered") {

            // If the tile has no content it is empty and this function is called recursively.
            if (tile.textContent == "") {
                tile.className = "tile empty";
                discovered_tiles++; 
                _reveal_empty_tiles(x_, y_);

            // If the tile isn't a mine it is a number and can be revealed.
            } else if (tile.textContent != "M") {
                tile.className = "tile number_" + Number(tile.textContent);
                discovered_tiles++;
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
function _top_is_mine(x: number, y: number): number {
    return tiles[y - 1][x].textContent == "M" ? 1 : 0;
}

/**
 * Checks if the tile below the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _bottom_is_mine(x: number, y: number): number {
    return tiles[y + 1][x].textContent == "M" ? 1 : 0;
}

/**
 * Checks if the tile to the left of the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _left_is_mine(x: number, y: number): number {
    return tiles[y][x-1].textContent == "M" ? 1 : 0;
}

/**
 * Checks if the tile to the right of the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _right_is_mine(x: number, y: number): number {
    return tiles[y][x+1].textContent == "M" ? 1 : 0;
}

/**
 * Checks if the tile to the top left of the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _top_left_is_mine(x: number, y: number): number {
    return tiles[y-1][x-1].textContent == "M" ? 1 : 0;
}

/**
 * Checks if the tile to the top right of the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _top_right_is_mine(x: number, y: number): number {
    return tiles[y-1][x+1].textContent == "M" ? 1 : 0;
}

/**
 * Checks if the tile to the bottom left of the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _bottom_left_is_mine(x: number, y: number): number {
    return tiles[y+1][x-1].textContent == "M" ? 1 : 0;
}

/**
 * Checks if the tile to the top left of the passed one is a mine. No edge case handeling is done here.
 * @param x The x-coordinate of the passed tile.
 * @param y The x-coordinate of the passed tile.
 * @returns Returns 1 if there is a mine, otherwise 0.
 */
function _bottom_right_is_mine(x: number, y: number): number {
    return tiles[y+1][x+1].textContent == "M" ? 1 : 0;
}

    //
    // - for actually creating the game
    //

/**
 * Creates the tiles and adds them to the field. 
 * @param width The width of the field / how many tiles are created per row.
 * @param height The height of the field / how many tiles are created per column.
 */
function _create_tiles(width: number, height: number) {
    let game = document.getElementById("field_container"); 
    let field: HTMLTableElement = document.createElement("table");

    if (game === null) {
        console.error("Could not retreive the HTMLElement with the id 'field_container'.");
        return;
    }

    game.appendChild(field);

    field.id = "field";

    for(let y: number = 0; y < height; y++) {
        let row: HTMLTableRowElement = document.createElement("tr");
        row.className = "tile_row";
        field.appendChild(row);
        tiles.push([]);

        for(let x: number = 0; x < width; x++) {
            let tile_td: HTMLTableCellElement = document.createElement("td");
            row.appendChild(tile_td);

            let tile: HTMLButtonElement = document.createElement("button");
            tile_td.appendChild(tile);

            tile.className = "tile undiscovered";
            tile.textContent = "";
            tile.oncontextmenu = () => {return false;};
            tile.onmousedown = function(event) {
                if (event.button == 0) {
                    reveal_tile(x, y, false);
                } else if (event.button == 2) {
                    let click_mode_backup: boolean = click_mode;
                    click_mode = true;
                    reveal_tile(x, y, false);
                    click_mode = click_mode_backup;
                }
            }

            tiles[y].push(tile);
        }
    }
}

/**
 * Sets the mines at pseudo random positions on the field. Certain tiles can be assigned to be left untouched.
 * @param exclude The tiles that are not supposed to become mines.
 */
function _set_mines(exclude: HTMLButtonElement[]): void {
    let exclude_length: number = exclude.length;
    let mines: HTMLButtonElement[] = exclude;

    for (let mine: number = 0; mine < amount_mines; mine++) {
        let temp: HTMLButtonElement[] = tiles[_get_random_index(tiles)];
        let new_mine: HTMLButtonElement = temp[_get_random_index(temp)];

        if (mines.includes(new_mine)) {
            mine--;
        } else {
            mines.push(new_mine);
        }
    }

    for (let mine: number = exclude_length; mine < mines.length; mine++) {
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
function _first_click(tile: HTMLButtonElement, x: number, y: number): void {
    if (!first_click_happened) {
        first_click_happened = true;

        let surrounding_tiles: [HTMLButtonElement, number, number][] = _get_surrounding_tiles(x, y);
        let surrounding_tiles2: HTMLButtonElement[] = [tile];
        for (let i: number = 0; i < surrounding_tiles.length; i++) {
            surrounding_tiles2.push(surrounding_tiles[i][0]);
        }

        _set_mines(surrounding_tiles2);
        _set_numbers();
        _init_flags();

        time_tracker.start();
    }
}

/**
 * Goes through the whole field, after the mines have been placed, and assigns the appropriate numbers to the tiles or,
 * if no mines are adjecent, leaves them blank (.textContent = ""). Mines are left intact.
 */
function _set_numbers(): void {
    // top left
    if (tiles[0][0].textContent != "M") {
        let surrounding: string = String(_bottom_is_mine(0, 0) + _right_is_mine(0, 0) + _bottom_right_is_mine(0, 0));
        tiles[0][0].textContent = surrounding == "0" ? "" : surrounding;
    }    

    // top right
    let x = tiles[0].length - 1;
    if (tiles[0][x].textContent != "M") {
        let surrounding: string = String(_bottom_is_mine(x, 0) + _left_is_mine(x, 0) + _bottom_left_is_mine(x, 0));
        tiles[0][x].textContent = surrounding == "0" ? "" : surrounding;
    }

    // bottom left
    let y = tiles.length - 1;
    if (tiles[y][0].textContent != "M") {
        let surrounding: string = String(_top_is_mine(0, y) + _right_is_mine(0, y) + _top_right_is_mine(0, y));
        tiles[y][0].textContent = surrounding == "0" ? "" : surrounding;
    }

    // bottom right
    if (tiles[y][x].textContent != "M") {
        let surrounding:string = String(_top_is_mine(x, y) + _left_is_mine(x, y) + _top_left_is_mine(x, y));
        tiles[y][x].textContent = surrounding == "0" ? "" : surrounding;
    }

    // first row, excluding first and last
    for (let x: number = 1; x < tiles[0].length - 1; x++) {
        if (tiles[0][x].textContent != "M") {
            let surrounding: string = String(_bottom_is_mine(x, 0) + _left_is_mine(x, 0) + _right_is_mine(x, 0) + 
                _bottom_left_is_mine(x, 0) + _bottom_right_is_mine(x, 0));
            tiles[0][x].textContent = surrounding == "0" ? "" : surrounding;
        }   
    }

    // last row, excluding first and last
    for (let x: number = 1; x < tiles[0].length - 1; x++) {
        let y: number = tiles.length - 1;
        if (tiles[y][x].textContent != "M") {
            let surrounding: string = String(_top_is_mine(x, y) + _left_is_mine(x, y) + _right_is_mine(x, y) + _top_left_is_mine(x, y)
                + _top_right_is_mine(x, y));
            tiles[y][x].textContent = surrounding == "0" ? "" : surrounding;
        }
    }

    // first column, excluding top and bottom
    for (let y: number = 1; y < tiles.length - 1; y++) {
        if (tiles[y][0].textContent != "M") {
            let surrounding: string = String(_top_is_mine(0, y) + _bottom_is_mine(0, y) + _right_is_mine(0, y) +
                _top_right_is_mine(0, y) + _bottom_right_is_mine(0, y));
            tiles[y][0].textContent = surrounding == "0" ? "" : surrounding;
        }
    }

    // last column, excluding top and bottom
    for (let y: number = 1; y < tiles.length - 1; y++) {
        let x: number = tiles[y].length - 1;
        if (tiles[y][x].textContent != "M") {
            let surrounding: string = String(_top_is_mine(x, y) + _bottom_is_mine(x, y) + _left_is_mine(x, y) +
            _top_left_is_mine(x, y) + _bottom_left_is_mine(x, y));
            tiles[y][x].textContent = surrounding == "0" ? "" : surrounding;
        }
    }

    // the remaining tiles
    for (let y: number = 1; y < tiles.length - 1; y++) {
        for (let x: number = 1; x < tiles[y].length - 1; x++) {
            if (tiles[y][x].textContent != "M") {
                let surrounding: string = String(_top_is_mine(x, y) + _bottom_is_mine(x, y) + _right_is_mine(x, y) + _left_is_mine(x, y)
                    + _top_left_is_mine(x, y) + _top_right_is_mine(x, y) + _bottom_left_is_mine(x, y) +
                    _bottom_right_is_mine(x, y));
                tiles[y][x].textContent = surrounding == "0" ? "" : surrounding;
            }
        }
    }
}

//
// - ui for the amount of placed flags
//

/**
 * Sets the flag count and the ui in the html document to zero and hides error which occurs if there are more flags
 * than mines.
 */
function _init_flags(): void {
    let flag_count = document.getElementById("flag_count");

    if (flag_count === null) {
        console.error("Could not retreive the HTMLElement with the id 'flag_count'.");
        return;
    }

    flag_count.textContent = "0/" + String(amount_mines) + " mines";

    let flags_error = document.getElementById("error_to_many_flags");

    if (flags_error === null) {
        console.error("Could not retreive the HTMLElement with the id 'error_to_many_flags'.");
        return;
    }

    flags_error.hidden = true;
}

/**
 * Adds a flag to the html documents ui and shows an error if there are more flags than mines.
 */
function _add_flag(): void {
    let flag_count = document.getElementById("flag_count");

    if (flag_count === null) {
        console.error("Could not retreive the HTMLElement with the id 'flag_count'.");
        return;
    }

    amount_flags++;
    flag_count.textContent = String(amount_flags) + "/" + String(amount_mines) + " mines";

    if (amount_flags > amount_mines) {
        let flags_error = document.getElementById("error_to_many_flags");

        if (flags_error === null) {
            console.error("Could not retreive the HTMLElement with the id 'error_to_many_flags'.");
            return;
        }

        flags_error.hidden = false;
    }
}

/**
 * Removes a flag from the html documents ui and hides error which occurs if there are more flags than mines.
 */
function _remove_flag(): void {
    let flag_count = document.getElementById("flag_count");

    if (flag_count === null) {
        console.error("Could not retreive the HTMLElement with the id 'flag_count'.");
        return;
    }

    amount_flags--;
    flag_count.textContent = String(amount_flags) + "/" + String(amount_mines) + " mines";

    if (amount_flags < amount_mines) {
        let flags_error = document.getElementById("error_to_many_flags");

        if (flags_error === null) {
            console.error("Could not retreive the HTMLElement with the id 'error_to_many_flags'.");
            return;
        }

        flags_error.hidden = true;
    }
}

//
// - set the visability of the game setup, game and the score board
//

/**
 * Toggles the hidden attribute for the game setup.
 * @param vis If it should be visible (true) or hidden (false).
 */
function _set_game_setup_visability(vis: boolean): void {
    let x = document.getElementById("game_setup");
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
function _set_tile_visability(vis: boolean): void {
    let x = document.getElementById("game");
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
function _set_scores_visability(vis: boolean): void {
    let x = document.getElementById("scores");
    if (x === null) {
        console.error("Could not retreive the HTMLElement with the id 'scores'.");
        return;
    }
    x.hidden = !vis;
}

//
// - death screen
//

/**
 * Sets some stuff for the death screen ui.
 * @param time_spent How long the user took to until they died.
 * @param size_width How wide the field was / how many tilea were in a row.
 * @param size_height How high the field was / how many tilea were in a column.
 * @param amount The amount of mines.
 */
function death_screen_set_stuff(time_spent: string, size_width: string, size_height: string, amount: string): void {
    let t = document.getElementById("death_screen_time_spent") as HTMLElement;
    let s = document.getElementById("death_screen_size") as HTMLElement;
    let a = document.getElementById("death_screen_amount_mines") as HTMLElement;

    if (t === null) {
        console.error("Could not retreive the HTMLElement with the id 'death_screen_time_spent'.");
        return;
    }
    if (s === null) {
        console.error("Could not retreive the HTMLElement with the id 'death_screen_size'.");
        return;
    }
    if (a === null) {
        console.error("Could not retreive the HTMLElement with the id 'death_screen_amount_mines'.");
        return;
    }

    t.textContent = time_spent;
    s.textContent = size_width + "x" + size_height;
    a.textContent = amount;
}

/**
 * Hides the death screen ui.
 */
function death_screen_hide() {
    let v = document.getElementById("death_screen") as HTMLElement;
    if (v === null) {
        console.error("Could not retreive the HTMLElement with the id 'death_screen'.");
        return;
    }
    v.hidden = true;
}

/**
 * Shows the death screen ui.
 */
function death_screen_show() {
    let v = document.getElementById("death_screen") as HTMLElement;
    if (v === null) {
        console.error("Could not retreive the HTMLElement with the id 'death_screen'.");
        return;
    }
    v.hidden = false;
}

//
// - on death
//

function _reveal_all_tile_contents() {
    for (let y: number = 0; y < tiles.length; y++) {
        for (let x: number = 0; x < tiles[y].length; x++) {
            reveal_tile(x, y, true);
        }
    }
}

//
// - victory screen 
//

/**
 * Sets some stuff for the victory screen ui.
 * @param time_spent How long the user took to win.
 * @param size_width How wide the field was / how many tilea were in a row.
 * @param size_height How high the field was / how many tilea were in a column.
 * @param amount The amount of mines.
 */
function victory_screen_set_stuff(time_spent: string, size_width: string, size_height: string, amount: string): void {
    let t = document.getElementById("victory_screen_time_spent") as HTMLElement;
    let s = document.getElementById("victory_screen_size") as HTMLElement;
    let a = document.getElementById("victory_screen_amount_mines") as HTMLElement;

    if (t === null) {
        console.error("Could not retreive the HTMLElement with the id 'victory_screen_time_spent'.");
        return;
    }
    if (s === null) {
        console.error("Could not retreive the HTMLElement with the id 'victory_screen_size'.");
        return;
    }
    if (a === null) {
        console.error("Could not retreive the HTMLElement with the id 'victory_screen_amount_mines'.");
        return;
    }

    t.textContent = time_spent;
    s.textContent = size_width + "x" + size_height;
    a.textContent = amount;
}

/**
 * Hides the victory screen ui.
 */
function victory_screen_hide() {
    let v = document.getElementById("victory_screen") as HTMLElement;
    if (v === null) {
        console.error("Could not retreive the HTMLElement with the id 'victory_screen'.");
        return;
    }
    v.hidden = true;
}

/**
 * Shows the victory screen ui.
 */
function victory_screen_show() {
    let v = document.getElementById("victory_screen") as HTMLElement;
    if (v === null) {
        console.error("Could not retreive the HTMLElement with the id 'victory_screen'.");
        return;
    }
    v.hidden = false;
}

function set_score() {
    let element = document.getElementById("user_name") as HTMLInputElement;
    let user_name = element.value;
    leaderboard.add_user(user_name, time_tracker.get_difference_ms(), String(tiles[0].length) + "x" + String(tiles.length), amount_mines, time_tracker.get_difference_display());

    back_button();
}

//
// - called from html document
//

/**
 * Handels what happens, when a tile is clicked.
 * @param x The tiles x-coordinate.
 * @param y The tiles y-coordinate.
 */
function reveal_tile(x: number, y: number, do_anyway: boolean): void {
    if (game_over && !do_anyway) {
        return;
    }

    let tile: HTMLButtonElement = tiles[y][x];
    _first_click(tile, x, y);
    let content = tile.textContent as string;
    let tile_class: string = tile.className;

    // reveal tile
    if (!click_mode) {

        // nothing happens when there is a flag or questionmark on the tile 
        if (tile_class == "tile undiscovered") {

            // if the tile is a mine
            if (content == "M") {
                let img = document.createElement("img") as HTMLImageElement;
                img.src = "assets/160x160/mine.png";
                img.className = "img";
                tile.appendChild(img);
                tile.className = "tile mine";
                
                if (do_anyway) {
                    return;
                }

                game_over = true;
                time_tracker.end();
                death_screen_set_stuff(time_tracker.get_difference_display(), String(tiles[0].length), String(tiles.length), String(amount_mines));
                death_screen_show();
                _reveal_all_tile_contents();

            // if the tile is empty
            } else if (content == "") {
                discovered_tiles++;
                tile.className = "tile empty";

                if (do_anyway) {
                    return;
                }

                _reveal_empty_tiles(x, y);
            
            // if the tile is a number
            } else {
                discovered_tiles++;
                tile.className = "tile number_" + content;
            }
        
        // if a tle with a number is clicked and there are enough flags and no questionmarks surrounding it, the tiles
        // surrounding tiles are revealed
        } else if (tile_class.startsWith("tile number_")) {
            if (do_anyway) {
                return;
            }

            let num = Number(tile_class.charAt(tile_class.length - 1));
            let flags: number = 0;

            let surrounding_tiles: [HTMLButtonElement, number, number][] = _get_surrounding_tiles(x, y);
            for (let i:number = 0; i < surrounding_tiles.length; i++) {
                if (surrounding_tiles[i][0].className == "tile flag") {
                    flags++;
                } else if (surrounding_tiles[i][0].className == "tile questionmark") {
                    return;
                }
            }

            if (flags == num) {
                let click_mode_backup: boolean = click_mode;
                click_mode = false;

                for (let i:number = 0; i < surrounding_tiles.length; i++) {
                    if (surrounding_tiles[i][0].className == "tile undiscovered") {
                        reveal_tile(surrounding_tiles[i][1], surrounding_tiles[i][2], false);
                    }
                }
                click_mode = click_mode_backup;
            }
        }
        
    // set flag
    } else {
        if (do_anyway) {
            return;
        }

        // undiscovered -> flag
        if (tile_class == "tile undiscovered") {
            let img = document.createElement("img") as HTMLImageElement;
            img.src = "assets/160x160/flag.png";
            img.className = "img";
            tile.appendChild(img);
            tile.className = "tile flag";
            _add_flag();
        
        // flag -> questionmark 
        } else if (tile_class == "tile flag") {
            tile.children[0].remove();
            let img = document.createElement("img") as HTMLImageElement;
            img.src = "assets/160x160/questionmark.png";
            img.className = "img";
            tile.appendChild(img);
            tile.className = "tile questionmark";
            _remove_flag();
        
        // questionmark -> undiscovered
        } else if (tile_class == "tile questionmark") {
            tile.children[0].remove();
            tile.className = "tile undiscovered";
        }
    }

    if(do_anyway) {
        return;
    }

    console.log(discovered_tiles);
    if ((discovered_tiles == (tiles[0].length * tiles.length - amount_mines)) && (!game_over)) {
        time_tracker.end();
        victory_screen_set_stuff(time_tracker.get_difference_display(), String(tiles[0].length), String(tiles.length), String(amount_mines));
        victory_screen_show();
        game_over = true;        
    }    
}

/**
 * Handels the creation of the field, hides the creation menu and unhides the game.
 * @param width The width of the field / how many tiles are created per row.
 * @param height The height of the field / how many tiles are created per column.
 * @param amount The amount of mines that are to be created.
 */
function create_field(width: number, height: number, amount: number): void {
    amount_mines = amount;
    _set_game_setup_visability(false);
    _clear_field();
    _create_tiles(width, height);      
    _set_tile_visability(true);
}

/**
 * Applys the custom input for a new game.
 */
function custom_setup(): void {
    _set_game_setup_visability(false);

    _clear_field()

    let x = document.getElementById("custom_width") as HTMLInputElement;
    if (x === null) {
        console.error("Could not retreive the HTMLElement with the id 'custom_width'.");
        return;
    }
    let width: number = Number(x.value);
    

    x = document.getElementById("custom_height") as HTMLInputElement;
    if (x === null) {
        console.error("Could not retreive the HTMLElement with the id 'custom_height'.");
        return;
    }
    let height = Number(x.value);

    x = document.getElementById("custom_amount_mines") as HTMLInputElement;
    if (x === null) {
        console.error("Could not retreive the HTMLElement with the id 'custom_amount_mines'.");
        return;
    }
    let amount = Number(x.value);

    if (amount + 9 > width * height) {
        // ERROR
        console.error("TO MANY MINES!!! (Just reduce the amount of mines.)");
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
function toggle_custom_input(input_visible: boolean): void {
    let custom_interface = document.getElementById("custom_interface");
    let button = document.getElementById("custom_button");

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
function back_button(): void {
    _set_tile_visability(false);
    _clear_field();
    _set_game_setup_visability(true);
}

/**
 * Changes the buuton and label content.
 */
function toggle_click_mode(): void {
    let button = document.getElementById("game_click_mode_button");
    let label = document.getElementById("game_click_mode_label");

    if (button === null) {
        console.error("Could not retreive the HTMLElement with the id 'game_click_mode_button'.");
        return;
    }
    if (label === null) {
        console.error("Could not retreive the HTMLElement with the id 'game_click_mode_label'.");
        return;
    }

    click_mode = !click_mode;

    let text_1: string = "set flag";
    let text_2: string = "reveal tile";

    if (click_mode) {
        button.textContent = text_1;
        label.textContent = "or " + text_2;
    } else {
        button.textContent = text_2;
        label.textContent = "or " + text_1;
    }
}

function go_to_leaderboard(): void {
    _set_game_setup_visability(false);
    leaderboard.show();
}

function back_from_leaderboard(): void {
    leaderboard.hide();
    _set_game_setup_visability(true);
}