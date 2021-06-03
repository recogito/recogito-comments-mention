import React, { Component } from 'preact/compat';
import TimeAgo from 'timeago-react';
import DropdownMenu from '@recogito/recogito-client-core/src/editor/widgets/comment/DropdownMenu';
import { ChevronDownIcon } from '@recogito/recogito-client-core/src/Icons';
import PurposeSelect from '@recogito/recogito-client-core/src/editor/widgets/comment/PurposeSelect';
import i18n from '@recogito/recogito-client-core/src/i18n';
import TextAreaWithMentions from './TextAreaWithMentions';

/** A single comment inside the CommentWidget **/
class Comment extends Component {

  constructor(props) {
    super(props);

    this.state = {
      isEditable: false,
      isMenuVisible: false
    }
  }

  render() {
    const onMakeEditable = _ => {
      this.setState({
        isEditable: true,
        isMenuVisible: true
      });
    }

    const onDelete = _ => {
      this.props.onDelete(this.props.body);

      this.setState({ isMenuVisible: false });
    }

    const onUpdateComment = evt =>
      this.props.onUpdate(this.props.body, { ...this.props.body, value: evt.target.value });

    const onChangePurpose = evt =>
      this.props.onUpdate(this.props.body, { ...this.props.body, purpose: evt.value });

    const timestamp = this.props.body.modified || this.props.body.created;

    const creatorInfo = this.props.body.creator &&
      <div className="r6o-lastmodified">
        <span className="r6o-lastmodified-by">{this.props.body.creator.name || this.props.body.creator.id}</span>
        {this.props.body.created &&
          <span className="r6o-lastmodified-at">
            <TimeAgo
              datetime={this.props.env.toClientTime(timestamp)}
              locale={i18n.locale()} />
          </span>
        }
      </div>

    return this.props.readOnly ? (
      <div className="r6o-widget comment">
        <div className="r6o-readonly-comment">{this.props.body.value}</div>
        { creatorInfo}
      </div>
    ) : (
      <div className={this.state.isEditable ? "r6o-widget comment editable" : "r6o-widget comment"}>
        <TextAreaWithMentions
          editable={this.state.isEditable}
          content={this.props.body.value}
          onChange={onUpdateComment}
          onSaveAndClose={this.props.onSaveAndClose}
          userSuggestions={this.props.userSuggestions || []}
        />

        { !this.state.isEditable && creatorInfo}

        { this.props.purposeSelector &&
          <PurposeSelect
            editable={this.state.isEditable}
            content={this.props.body.purpose}
            onChange={onChangePurpose}
            onSaveAndClose={this.props.onSaveAndClose}
          />}

        <div
          className={this.state.isMenuVisible ? "r6o-icon r6o-arrow-down r6o-menu-open" : "r6o-icon r6o-arrow-down"}
          onClick={() => this.setState({ isMenuVisible: !this.state.isMenuVisible })}>
          <ChevronDownIcon width={12} />
        </div>

        { this.state.isMenuVisible &&
          <DropdownMenu
            onEdit={onMakeEditable}
            onDelete={onDelete}
            onClickOutside={() => this.setState({ isMenuVisible: false })} />
        }
      </div>
    )

  }

}

export default Comment;