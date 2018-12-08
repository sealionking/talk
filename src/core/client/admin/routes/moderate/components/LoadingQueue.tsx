import React, { StatelessComponent } from "react";

import { Delay, Flex, Spinner } from "talk-ui/components";

const LoadingQueue: StatelessComponent = () => (
  <Flex justifyContent="center">
    <Spinner />
  </Flex>
);

export default LoadingQueue;
