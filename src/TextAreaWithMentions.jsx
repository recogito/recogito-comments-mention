import React, { Component } from 'preact/compat';
import styles from './TextAreaWithMentions.css';
import i18n from '@recogito/recogito-client-core/src/i18n';

/** 
 * A basic text entry field, for reuse in different widgets.
 */
export default class TextAreaWithMentions extends Component {

    currentAtMentionTextValue = ''
    myFragment
    dropdownDivHolderDiv
    dropDownDiv
    myDropDownDiv
    unorderedList
    backdropDiv
    highLightsDiv
    textAreaElement
    currentFocus
    properties
    isFireFox
    mirrorDivDisplayCheckbox
    mirrorDiv

    constructor(props) {
        super(props);

        // Load the user suggestions passed from Recogito
        var users = props.userSuggestions || []

        this.myFragment = React.createRef()
        this.dropdownDivHolderDiv = React.createRef()
        this.dropDownDiv = React.createRef()
        this.myDropDownDiv = React.createRef()
        this.unorderedList = React.createRef()
        this.backdropDiv = React.createRef()
        this.highLightsDiv = React.createRef()
        this.textAreaElement = React.createRef()
        this.state = { showDropDown: false, backupUsers: users, users: users, usersMap: {} }
    }

    componentDidMount() {
        this.textAreaElement.current.addEventListener('input', this.onTextAreaInput.bind(this))

        // Create a users map for conversion between markup string and user-facing string.
        this.state.usersMap = {}  // Mapping of displayed usernames with the markup.
        this.state.users.forEach(user => {
            this.state.usersMap['@' + user.name] = '@' + user.name + ':' + user.id
        })

        this.currentAtMentionTextValue = this.props.content

        // Convert the Markup test so received into plain text value.
        this.currentAtMentionTextValue = this.getUserFacingTextFromMarkUpString(this.currentAtMentionTextValue)

        // Initialization
        var observe;
        if (window.attachEvent) {
            observe = function (element, event, handler) {
                element.attachEvent('on' + event, handler);
            };
        }
        else {
            observe = function (element, event, handler) {
                element.addEventListener(event, handler, false);
            };
        }

        // Highlight @users.
        this.handleInput()

        var defaultFocus = 't-0';
        this.currentFocus = defaultFocus;

        // Append Child Nodes.
        this.clearChildNodes(this.unorderedList.current)
        this.appendChildNodes(this.unorderedList.current, this.state.users)

        // Close the dropdown if the user clicks outside of it
        var that = this
        window.onclick = function (event) {
            if (!event.target.matches('.dropbtn')) {
                that.hideDropdown()
            }
        }

        // The properties that we copy into a mirrored div.
        // Note that some browsers, such as Firefox,
        // do not concatenate properties, i.e. padding-top, bottom etc. -> padding,
        // so we have to do every single property specifically.
        this.properties = [
            'boxSizing',
            'width', // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
            'height',
            'overflowX',
            'overflowY', // copy the scrollbar for IE

            'borderTopWidth',
            'borderRightWidth',
            'borderBottomWidth',
            'borderLeftWidth',

            'paddingTop',
            'paddingRight',
            'paddingBottom',
            'paddingLeft',

            // https://developer.mozilla.org/en-US/docs/Web/CSS/font
            'fontStyle',
            'fontVariant',
            'fontWeight',
            'fontStretch',
            'fontSize',
            'lineHeight',
            'fontFamily',

            'textAlign',
            'textTransform',
            'textIndent',
            'textDecoration', // might not make a difference, but better be safe

            'letterSpacing',
            'wordSpacing'
        ];

        this.isFirefox = !(window.mozInnerScreenX == null);
        this.mirrorDivDisplayCheckbox = document.getElementById('mirrorDivDisplay');

        // Code to reize the text area based on the text entered.
        window.setTimeout(this.resize.bind(this), 0);
    }

    applyHighlights(text) {
        return text
            .replace(/\n$/g, '\n\n')
            .replace(/@[a-zA-Z].*?\b/g, '<span style="background-color: rgba(255,165,0,0.2); border-bottom: 2px solid orange;">$&</span>');  // highlight instances of @srinidhi
    }

    handleScroll() {
        this.backdropDiv.current.scrollTop = this.textAreaElement.current.scrollTop;
        this.backdropDiv.current.scrollLeft = this.textAreaElement.current.scrollLeft;
    }

    handleTextAreaChange(text) {
        console.log('Text Area Lost Focus: ' + text)
        if (this.currentAtMentionTextValue) {
            console.log('Text Set: ' + text)
        } else {
            console.log('Text Updated: ' + text)
        }
    }

    //////// CONVERSIONS BETWEEN MARKUP AND PLAIN STRING ////////////

    getUserFacingTextFromMarkUpString(markupString) {
        if (!markupString) {
            return ''
        }
        return markupString
            .replace(/@[a-zA-Z].*?:[a-zA-z0-9@.]+\b/g, function (value) {
                let components = value.split(':')
                return components[0]
            });
    }

    getMarkupStringFromUserFacingString(userfacingString) {
        if (!userfacingString) {
            return ''
        }
        var that = this;
        return userfacingString
            .replace(/@[a-zA-Z].*?\b/g, function (value) {
                return that.state.usersMap[value] ? that.state.usersMap[value] : value;
            });
    }

    //////// CONVERSIONS BETWEEN MARKUP AND PLAIN STRING COMPLETED ////////////

    ////////// UPDATE START ////////

    handleKeyDown(event) {
        var currentIndex = parseInt(this.currentFocus.split('-')[1])
        var nextIndex = 0;
        switch (event.code) {
            case 'ArrowUp':
                nextIndex = (currentIndex - 1) % this.state.users.length;
                break;
            case 'ArrowDown':
                nextIndex = (currentIndex + 1) % this.state.users.length;
                break;
            case 'Enter':
                this.handleSelection(currentFocus);
                break;
        }

        if (event.code == 'Enter') {
            return
        }

        if (nextIndex < 0)
            nextIndex = this.state.users.length - 1

        this.currentFocus = 't-' + nextIndex
        document.getElementById(currentFocus).focus();
    }

    clearChildNodes(unorderedList) {
        this.unorderedList.current.innerHTML = ''
    }

    appendChildNodes(unorderedList, users) {
        for (let index = 0; index < users.length; index++) {
            const user = users[index];

            const listItem = document.createElement('li')
            listItem.setAttribute('id', 't-' + index);
            listItem.setAttribute('tabIndex', '-1');
            listItem.addEventListener('click', this.onListItemClick.bind(this))
            listItem.style['list-style-type'] = 'none'
            // listItem.appendChild(document.createTextNode(user.name))

            const hrefItem = document.createElement('a')
            hrefItem.setAttribute('href', '#' + user.name);
            hrefItem.appendChild(document.createTextNode(user.name));
            listItem.appendChild(hrefItem)

            this.unorderedList.current.appendChild(listItem)
        }
    }

    filterUsers(users, searchText) {
        if (!searchText) {
            return users;
        }
        if (searchText.startsWith('@')) {
            searchText = searchText.substring(1)
        }
        const filteredUsers = this.state.backupUsers.filter(user => {
            if (user.name.toUpperCase().includes(searchText.toUpperCase())) {
                return true;
            }
            return false;
        })
        return filteredUsers
    }

    onTextAreaInput(event) {
        const textareaText = event.target.value
        const cursorPosition = this.textAreaElement.current.selectionStart

        let textForConsideration = textareaText.substring(0, cursorPosition)
        let lastIndexOfSpaceCharacter = textForConsideration.lastIndexOf(' ')
        let lastIndexOfAtCharacter = textForConsideration.lastIndexOf('@')
        if (lastIndexOfAtCharacter > lastIndexOfSpaceCharacter) {
            let patternToMatch = textForConsideration.substring(lastIndexOfAtCharacter + 1)
            const filteredUsers = this.filterUsers(this.state.backupUsers, patternToMatch)
            if (filteredUsers.length > 0) {
                this.clearChildNodes(this.unorderedList.current)
                this.appendChildNodes(this.unorderedList.current, filteredUsers)
                this.showDropdown()
            }
            else {
                this.hideDropdown()
            }
        }
        else {
            this.hideDropdown()
        }
        this.handleInput()
    }

    ////////// UPDATE COMPLETE ////////

    showDropdown() {
        const coordinates = this.getCaretCoordinates(this.textAreaElement.current, this.textAreaElement.current.selectionEnd);
        // Account for Top scroll. 
        coordinates.top = coordinates.top - this.textAreaElement.current.scrollTop
        this.myDropDownDiv.current.style['top'] = coordinates.top + 20 + 'px';
        this.myDropDownDiv.current.style['left'] = coordinates.left + 'px';

        this.setState({ showDropDown: true })
    }

    hideDropdown() {
        this.setState({ showDropDown: false })
    }

    handleSelection(id) {

        let updatedCursorPosition = this.insertAtCursor(this.textAreaElement.current, document.getElementById(id).innerText + ' ')
        this.setState({ showDropDown: false })

        setTimeout(() => {
            this.textAreaElement.current.focus({ preventScroll: true })
            this.textAreaElement.current.selectionStart = updatedCursorPosition
            this.textAreaElement.current.selectionEnd = updatedCursorPosition
            this.textAreaElement.current.setSelectionRange(updatedCursorPosition, updatedCursorPosition);
        }, 100)

        this.handleInput()
    }

    insertAtCursor(myField, myValue) {
        //IE support
        if (document.selection) {
            myField.focus();
            sel = document.selection.createRange();
            sel.text = myValue;
        }
        //MOZILLA and others
        else if (myField.selectionStart || myField.selectionStart == '0') {

            let textForConsideration = myField.value.substring(0, myField.selectionStart)
            var startPos = textForConsideration.lastIndexOf('@') + 1

            let endPos = myField.selectionEnd;
            myField.value = myField.value.substring(0, startPos)
                + myValue
                + myField.value.substring(endPos, myField.value.length);
        } else {
            myField.value += myValue;
        }
        return startPos + myValue.length
    }

    getCaretCoordinates(element, position) {
        // mirrored div
        this.mirrorDiv = document.getElementById(element.nodeName + '--mirror-div');
        if (!this.mirrorDiv) {
            this.mirrorDiv = document.createElement('div');
            this.mirrorDiv.id = element.nodeName + '--mirror-div';
            document.body.appendChild(this.mirrorDiv);
        }

        var style = this.mirrorDiv.style;
        var computed = getComputedStyle(element);

        // default textarea styles
        style.whiteSpace = 'pre-wrap';
        if (element.nodeName !== 'INPUT')
            style.wordWrap = 'break-word'; // only for textarea-s

        // position off-screen
        style.position = 'absolute'; // required to return coordinates properly
        style.top = element.offsetTop + parseInt(computed.borderTopWidth) + 'px';
        style.left = "400px";
        style.visibility = 'hidden'; // not 'display: none' because we want rendering

        // transfer the element's properties to the div
        this.properties.forEach(function (prop) {
            style[prop] = computed[prop];
        });

        if (this.isFirefox) {
            style.width = parseInt(computed.width) - 2 + 'px' // Firefox adds 2 pixels to the padding - https://bugzilla.mozilla.org/show_bug.cgi?id=753662
            // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
            if (element.scrollHeight > parseInt(computed.height))
                style.overflowY = 'scroll';
        } else {
            style.overflow = 'hidden'; // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
        }

        this.mirrorDiv.textContent = element.value.substring(0, position);
        // the second special handling for input type="text" vs textarea: spaces need to be replaced with non-breaking spaces - http://stackoverflow.com/a/13402035/1269037
        if (element.nodeName === 'INPUT')
            this.mirrorDiv.textContent = this.mirrorDiv.textContent.replace(/\s/g, "\u00a0");

        var span = document.createElement('span');
        // Wrapping must be replicated *exactly*, including when a long word gets
        // onto the next line, with whitespace at the end of the line before (#7).
        // The  *only* reliable way to do that is to copy the *entire* rest of the
        // textarea's content into the <span> created at the caret position.
        // for inputs, just '.' would be enough, but why bother?
        span.textContent = element.value.substring(position) || '.'; // || because a completely empty faux span doesn't render at all
        span.style.backgroundColor = "lightgrey";
        this.mirrorDiv.appendChild(span);

        var coordinates = {
            top: span.offsetTop + parseInt(computed['borderTopWidth']),
            left: span.offsetLeft + parseInt(computed['borderLeftWidth'])
        };

        return coordinates;
    }

    /////////// Remove @Mention words on single backspace ////////
    /**
     * Courtesy: Basit Ali's answer to the following StackOverflow post.
     * https://stackoverflow.com/questions/24495012/removing-the-whole-word-from-textarea-while-pressing-backspace 
     */

    getCursorPosition() {
        var el = this.textAreaElement.current;
        var pos = 0;
        var posEnd = 0;
        if ('selectionStart' in el) {
            pos = el.selectionStart;
            posEnd = el.selectionEnd;
        } else if ('selection' in document) {
            el.focus();
            var Sel = document.selection.createRange();
            var SelLength = document.selection.createRange().text.length;
            Sel.moveStart('character', -el.value.length);
            pos = Sel.text.length - SelLength;
            posEnd = Sel.text.length;
        }
        return [pos, posEnd];
    };

    setCursorPosition(start, end) {
        this.textAreaElement.current.selectionStart = start
        this.textAreaElement.current.selectionEnd = end
    }

    handleTextAreaKeyDown(e) {
        var position = this.getCursorPosition();
        var deleted = '';
        var val = this.textAreaElement.current.value;
        if (e.which != 8) {
            return true;
        }

        if (position[0] != position[1]) {
            return true;
        }

        if (position[0] <= 0) {
            return true;
        }

        let charToDelete = val.substr(position[0] - 1, 1);
        if (charToDelete == " ") {
            return true;
        }

        // Is the word to be deleted, contains @mention
        let textForConsideration = val.substring(0, position[0])
        let lastIndexOfSpaceCharacter = textForConsideration.lastIndexOf(' ')
        let lastIndexOfAtCharacter = textForConsideration.lastIndexOf('@')
        if (lastIndexOfSpaceCharacter > lastIndexOfAtCharacter) {   // Not referring to @mention word.
            return true;
        }

        let nextChar = val.substr(position[0], 1);

        if (nextChar == " " || nextChar == "") {
            var start = position[0];
            var end = position[0];

            while (val.substr(start - 1, 1) != " " && start - 1 >= 0) {
                start -= 1;
            }

            e.preventDefault();
            this.setCursorPosition(start, end);
            this.handleInput()
        }
    }

    /////////// END - Remove @mention words on backspace ////////


    // Elements and the focus

    onListItemClick(event) {
        this.handleSelection(event.currentTarget.id)
    }


    resize() {

        var MAX_HEIGHT = 130;

        if (!this.textAreaElement) {
            return;
        }

        // Reset the Caret Position
        // This is required for apps running within Windows UWP app.
        // Accounting for the React JS way of doing things as explained here:
        // https://stackoverflow.com/questions/35535688/stop-cursor-jumping-when-formatting-number-in-react
        const caret = this.textAreaElement.current.selectionStart
        const element = this.textAreaElement.current
        window.requestAnimationFrame(() => {
            element.selectionStart = caret
            element.selectionEnd = caret
        })

        var textAreaElement = this.textAreaElement.current
        var text = textAreaElement.value

        textAreaElement.style.height = 'auto';

        var heightToConsider = 0
        if (textAreaElement.scrollHeight > MAX_HEIGHT) {
            heightToConsider = MAX_HEIGHT
        }
        else {
            heightToConsider = textAreaElement.scrollHeight + 10
        }

        textAreaElement.style.height = heightToConsider + 'px'

        this.backdropDiv.current.style.height = 'auto';
        this.backdropDiv.current.style.height = textAreaElement.style.height;
    }

    // /* 0-timeout to get the already changed text */
    delayedResize() {
        window.setTimeout(this.resize, 0);
    }

    handleInput() {
        this.highLightsDiv.current.innerHTML = this.applyHighlights(this.textAreaElement.current.value);

        // Send the change.
        this.props.onChange(this.textAreaElement.current.value)
    }

    render() {

        return (
            <div>
                <div ref={this.dropdownDivHolderDiv} id='dropdownDivHolderDiv'>
                    <div ref={this.dropDownDiv} class='dropdown' id='dropdownDiv'>
                        <div ref={this.myDropDownDiv} class={this.state.showDropDown ? 'dropdown-content show' : 'dropdown-content hide'} id='myDropdown' onKeyDown={this.handleKeyDown}>
                            <ul ref={this.unorderedList} class='unorderedList' id='usersList'></ul>
                        </div>
                    </div>
                </div>
                <div ref={this.myFragment} class='container' id='myFragment'>
                    <div ref={this.backdropDiv} class={this.props.editable ? 'backdrop' : 'backdrop-white'} id='backdropDiv'>
                        <div ref={this.highLightsDiv} class='highlights' id='highlightsDiv'>
                        </div>
                    </div>
                    <textarea
                        ref={this.textAreaElement}
                        id='textarea'
                        class='textareaStyle'
                        rows='1'
                        placeholder={this.props.placeholder || i18n.t('Add a comment...')}
                        class='TextArea'

                        onScroll={this.handleScroll.bind(this)}
                        onKeyDown={this.handleTextAreaKeyDown.bind(this)}
                        disabled={!this.props.editable}
                        onChange={this.resize.bind(this)}
                        onCut={this.delayedResize.bind(this)}
                        onPaste={this.delayedResize.bind(this)}
                        onDrop={this.delayedResize.bind(this)}
                        onKeydown={this.delayedResize.bind(this)}>

                        {this.props.content}
                    </textarea>
                </div>
            </div>

        )
    }
}


