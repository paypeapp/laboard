var q = require('q'),
	_ = require('lodash'),
    GitlabIssues = require('../gitlab/issues'),
	issues = module.exports = function issues(db, client, projects, formatter, container) {
		this.db = db;
		this.formatter = formatter;
		this.container = container;

		this.gitlab = new GitlabIssues(client, projects, formatter, container);

		this.sqlSelect = "select i.id, i.iid, i.project_id, i.title, i.description, i.state, i.created_at, i.updated_at,\
				p.path as project, n.path as namespace,\
				array(select l.title from label_links as ll left join labels as l on l.id = ll.label_id where target_type='Issue' and ll.target_id=i.id) as labels,\
				(SELECT json_agg(t) FROM (select name, email, username, id, state, avatar from users as u where u.id = i.assignee_id) AS t)::text as assignee,\
				(SELECT json_agg(t) FROM (select name, email, username, id, state, avatar from users as u where u.id = i.author_id) AS t)::text as author,\
				(select m.title from milestones as m where m.id=i.milestone_id) as milestone\
				from issues as i\
				left join projects as p on i.project_id = p.id\
				left join namespaces as n on p.namespace_id = n.id\
				where i.state != 'closed'";
	};

issues.prototype = {
	one: function(token, namespace, project, id) {
		var self = this,
			deferred = q.defer(),
			sql = this.sqlSelect + ' and i.id=$1;';

		this.db.get(
			sql,
			[id],
			function(err, resp, body) {
				if (err) {
					deferred.reject(err);
				} else {
					deferred.resolve(this.formatter.formatIssueFromGitlab(self.buildAvatarsForIssue(body[0])));
				}
			}.bind(this)
		);

		return deferred.promise;
	},

	all: function() {
		var self = this,
			deferred = q.defer(),
			issues = [],
			sql = this.sqlSelect + ';',
			fetch = function() {
				this.db.get(
					sql,
					[],
					function(err, resp, body) {
						if (err) {
							deferred.reject(err);
						} else {
							issues = issues.concat(
								body
									.filter(function (issue) {
										return issue.state !== 'closed' || issue.labels.indexOf(this.container.get('config').board_prefix + 'starred') > -1;
									}.bind(this))
									.map(this.formatter.formatIssueFromGitlab)
							);

							issues = _.forEach(issues, function(e) {
								return self.buildAvatarsForIssue(e);
							});

							deferred.resolve(issues);
						}
					}.bind(this)
				);

				return deferred.promise;
			}.bind(this);

		return fetch();
	},

	persist: function(token, namespace, project, issue) {
		return this.gitlab.persist(token, issue.namespace, issue.project, issue);
	},

	close: function(token, namespace, project, issue) {
		issue.state_event = 'close';

		return this.persist(token, namespace, project, issue);
	},

	// build avatars for assignee and author, first using upload then gravatar (email)
	buildAvatarsForIssue: function(issue) {
		var gitlabUrl = this.container.get('config').gitlab_url + '/uploads/user/avatar/';

		if(issue.assignee) {
			try {
				issue.assignee = JSON.parse(issue.assignee)[0];
			} catch (e) {}
			if(issue.assignee.avatar) {
				issue.assignee.avatar_url = gitlabUrl + issue.assignee.id + '/' + issue.assignee.avatar;
				delete issue.assignee.email;
			}
		}

		if(issue.author) {
			try {
				issue.author = JSON.parse(issue.author)[0];
			} catch (e) {}
			if(issue.author.avatar) {
				issue.author.avatar_url = gitlabUrl + issue.author.id + '/' + issue.author.avatar;
				delete issue.author.email;
			}
		}

		return issue;
	}
};