import React from "react";
import { graphql } from "react-relay";

import { ModerateCardContainer_comment as CommentData } from "talk-admin/__generated__/ModerateCardContainer_comment.graphql";
import { ModerateCardContainer_settings as SettingsData } from "talk-admin/__generated__/ModerateCardContainer_settings.graphql";
import { withFragmentContainer } from "talk-framework/lib/relay";

import ModerateCard from "../components/ModerateCard";

interface ModerateCardContainerProps {
  comment: CommentData;
  settings: SettingsData;
}

function getStatus(comment: CommentData) {
  switch (comment.status) {
    case "ACCEPTED":
      return "approved";
    case "REJECTED":
      return "rejected";
    default:
      return "undecided";
  }
}

class ModerateCardContainer extends React.Component<
  ModerateCardContainerProps
> {
  public render() {
    const { comment, settings } = this.props;
    return (
      <ModerateCard
        username={comment.author!.username!}
        createdAt={comment.createdAt}
        body={comment.body!}
        inReplyTo={comment.parent && comment.parent.author!.username!}
        comment={comment}
        status={getStatus(comment)}
        viewContextHref={comment.permalink}
        suspectWords={settings.wordList.suspect}
        bannedWords={settings.wordList.banned}
      />
    );
  }
}

const enhanced = withFragmentContainer<ModerateCardContainerProps>({
  comment: graphql`
    fragment ModerateCardContainer_comment on Comment {
      id
      author {
        username
      }
      createdAt
      body
      status
      parent {
        author {
          username
        }
      }
      permalink
      ...MarkersContainer_comment
    }
  `,
  settings: graphql`
    fragment ModerateCardContainer_settings on Settings {
      wordList {
        banned
        suspect
      }
    }
  `,
})(ModerateCardContainer);

export default enhanced;
