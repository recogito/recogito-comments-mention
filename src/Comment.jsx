import React from 'preact/compat';
import { useState } from 'preact/hooks';
import TimeAgo from 'timeago-react';
import DropdownMenu from '@recogito/recogito-client-core/src/editor/widgets/comment/DropdownMenu';
import { ChevronDownIcon } from '@recogito/recogito-client-core/src/Icons';
import PurposeSelect from '@recogito/recogito-client-core/src/editor/widgets/comment/PurposeSelect';
import i18n from '@recogito/recogito-client-core/src/i18n';
import TextAreaWithMentions from './TextAreaWithMentions';

/** A single comment inside the CommentWidget **/
const Comment = props => {

  const [isEditable, setIsEditable] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const onMakeEditable = _ => {
    setIsEditable(true);
    setIsMenuVisible(false);
  }

  const onDelete = _ => {
    props.onDelete(props.body);
    setIsMenuVisible(false);
  }

  const onUpdateComment = evt =>
    props.onUpdate(props.body, { ...props.body, value: evt.target.value });

  const onChangePurpose = evt =>
    props.onUpdate(props.body, { ...props.body, purpose: evt.value });

  const timestamp = props.body.modified || props.body.created;

  const creatorInfo = props.body.creator &&
    <div className="r6o-lastmodified">
      <span className="r6o-lastmodified-by">{props.body.creator.name || props.body.creator.id}</span>
      {props.body.created &&
        <span className="r6o-lastmodified-at">
          <TimeAgo
            datetime={props.env.toClientTime(timestamp)}
            locale={i18n.locale()} />
        </span>
      }
    </div>

  return props.readOnly ? (
    <div className="r6o-widget comment">
      <div className="r6o-readonly-comment">{props.body.value}</div>
      { creatorInfo}
    </div>
  ) : (
    <div className={isEditable ? "r6o-widget comment editable" : "r6o-widget comment"}>
      <TextAreaWithMentions
        editable={isEditable}
        content={props.body.value}
        onChange={onUpdateComment}
        onSaveAndClose={props.onSaveAndClose}
        userSuggestions={props.userSuggestions || []}
      />

      { !isEditable && creatorInfo}

      { props.purposeSelector &&
        <PurposeSelect
          editable={isEditable}
          content={props.body.purpose}
          onChange={onChangePurpose}
          onSaveAndClose={props.onSaveAndClose}
        />}

      <div
        className={isMenuVisible ? "r6o-icon r6o-arrow-down r6o-menu-open" : "r6o-icon r6o-arrow-down"}
        onClick={() => setIsMenuVisible(!isMenuVisible)}>
        <ChevronDownIcon width={12} />
      </div>

      { isMenuVisible &&
        <DropdownMenu
          onEdit={onMakeEditable}
          onDelete={onDelete}
          onClickOutside={() => setIsMenuVisible(false)} />
      }
    </div>
  )

}

export default Comment;