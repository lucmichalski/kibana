/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { Router, Route, Switch, useParams } from 'react-router-dom';
import { i18n } from '@kbn/i18n';
import { StartServicesAccessor } from 'src/core/public';
import { RegisterManagementAppArgs } from '../../../../../../src/plugins/management/public';
import { PluginStartDependencies } from '../../plugin';
import { DocumentationLinksService } from './documentation_links';
import { tryDecodeURIComponent } from '../url_utils';

interface CreateParams {
  getStartServices: StartServicesAccessor<PluginStartDependencies>;
}

export const roleMappingsManagementApp = Object.freeze({
  id: 'role_mappings',
  create({ getStartServices }: CreateParams) {
    return {
      id: this.id,
      order: 40,
      title: i18n.translate('xpack.security.management.roleMappingsTitle', {
        defaultMessage: 'Role Mappings',
      }),
      async mount({ element, setBreadcrumbs, history }) {
        const [coreStart] = await getStartServices();
        const roleMappingsBreadcrumbs = [
          {
            text: i18n.translate('xpack.security.roleMapping.breadcrumb', {
              defaultMessage: 'Role Mappings',
            }),
            href: `/`,
          },
        ];

        const [
          [{ docLinks, http, notifications, i18n: i18nStart }],
          { RoleMappingsGridPage },
          { EditRoleMappingPage },
          { RoleMappingsAPIClient },
          { RolesAPIClient },
        ] = await Promise.all([
          getStartServices(),
          import('./role_mappings_grid'),
          import('./edit_role_mapping'),
          import('./role_mappings_api_client'),
          import('../roles'),
        ]);

        const roleMappingsAPIClient = new RoleMappingsAPIClient(http);
        const dockLinksService = new DocumentationLinksService(docLinks);
        const RoleMappingsGridPageWithBreadcrumbs = () => {
          setBreadcrumbs(roleMappingsBreadcrumbs);
          return (
            <RoleMappingsGridPage
              notifications={notifications}
              rolesAPIClient={new RolesAPIClient(http)}
              roleMappingsAPI={roleMappingsAPIClient}
              docLinks={dockLinksService}
              history={history}
              navigateToApp={coreStart.application.navigateToApp}
            />
          );
        };

        const EditRoleMappingsPageWithBreadcrumbs = () => {
          const { name } = useParams<{ name?: string }>();

          // Additional decoding is a workaround for a bug in react-router's version of the `history` module.
          // See https://github.com/elastic/kibana/issues/82440
          const decodedName = name ? tryDecodeURIComponent(name) : undefined;

          setBreadcrumbs([
            ...roleMappingsBreadcrumbs,
            name
              ? { text: decodedName, href: `/edit/${encodeURIComponent(name)}` }
              : {
                  text: i18n.translate('xpack.security.roleMappings.createBreadcrumb', {
                    defaultMessage: 'Create',
                  }),
                },
          ]);

          return (
            <EditRoleMappingPage
              name={decodedName}
              roleMappingsAPI={roleMappingsAPIClient}
              rolesAPIClient={new RolesAPIClient(http)}
              notifications={notifications}
              docLinks={dockLinksService}
              history={history}
            />
          );
        };

        render(
          <i18nStart.Context>
            <Router history={history}>
              <Switch>
                <Route path={['/', '']} exact={true}>
                  <RoleMappingsGridPageWithBreadcrumbs />
                </Route>
                <Route path="/edit/:name?">
                  <EditRoleMappingsPageWithBreadcrumbs />
                </Route>
              </Switch>
            </Router>
          </i18nStart.Context>,
          element
        );

        return () => {
          unmountComponentAtNode(element);
        };
      },
    } as RegisterManagementAppArgs;
  },
});
